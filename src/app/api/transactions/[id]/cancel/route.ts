import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { reverseFutureStock } from "@/lib/future-stock";
import { logActivity } from "@/lib/logging";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        // Only Managers or Admins can cancel (Role >= 7)
        if (!session || session.user.role < 7) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const txId = parseInt(id);

        const tx = await prisma.transactionHeader.findUnique({
            where: { id: txId },
            include: {
                details: true,
                documentType: true
            },
        });

        if (!tx) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        if (tx.docStatus !== "DRAFT") {
            return NextResponse.json({ error: "Can only cancel DRAFT documents" }, { status: 400 });
        }

        // Determine direction for this transaction type
        const isOutbound = tx.documentType.movementType === "OUT" || tx.docTypeCode === "TRN";
        const direction: "IN" | "OUT" = isOutbound ? "OUT" : "IN";

        // Reverse future stock for each detail item
        for (const item of tx.details) {
            await reverseFutureStock({
                productCode: item.productCode,
                whCode: tx.whCode,
                locCode: item.locCode || "",
                pieceQty: Number(item.pieceQty),
                direction: direction,
                mfgDate: item.mfgDate,
                expDate: item.expDate,
                docNo: tx.docNo,
                userId: session.user.userId,
            });

            // For Transfer, also reverse destination warehouse future stock
            if (tx.docTypeCode === "TRN" && tx.toWhCode) {
                await reverseFutureStock({
                    productCode: item.productCode,
                    whCode: tx.toWhCode,
                    locCode: item.locCode || "",
                    pieceQty: Number(item.pieceQty),
                    direction: "IN",
                    mfgDate: item.mfgDate,
                    expDate: item.expDate,
                    docNo: tx.docNo,
                    userId: session.user.userId,
                });
            }
        }

        // Update transaction status
        const updated = await prisma.transactionHeader.update({
            where: { id: txId },
            data: {
                docStatus: "CANCELLED",
                docState: "CLOSED",
                updatedBy: session.user.userId,
                updatedUserName: session.user.name,
            },
        });

        // Log the cancellation activity
        await logActivity({
            userId: session.user.userId,
            username: session.user.name || session.user.userId,
            action: "CANCEL",
            module: "TRANSACTION",
            docNo: tx.docNo,
            description: `ยกเลิกเอกสาร ${tx.docNo} (${tx.documentType.docTypeName})`,
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Cancellation error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to cancel transaction" },
            { status: 500 }
        );
    }
}
