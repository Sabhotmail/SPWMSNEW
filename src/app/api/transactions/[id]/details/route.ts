import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { serializeForJSON } from "@/lib/serialize";
import { updateFutureStock, checkStockAvailability } from "@/lib/future-stock";

// POST - Add item to transaction
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const txId = parseInt(id);
        const body = await request.json();
        const { productCode, qty, uomCode, uomRatio, pieceQty, locCode, mfgDate, expDate, lotNo, remark } = body;

        // Get transaction header to check status and get whCode
        const tx = await prisma.transactionHeader.findUnique({
            where: { id: txId },
            include: {
                _count: { select: { details: true } },
                documentType: true
            }
        });

        if (!tx) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        if (tx.docStatus !== "DRAFT") {
            return NextResponse.json({ error: "Cannot add items to non-DRAFT transaction" }, { status: 400 });
        }

        const itemPieceQty = pieceQty || Number(qty);
        const itemLocCode = locCode || "";
        const isOutbound = tx.documentType.movementType === "OUT" || tx.docTypeCode === "TRN";

        // For outbound transactions, validate stock availability
        if (isOutbound) {
            const stockCheck = await checkStockAvailability(
                productCode,
                tx.whCode,
                itemPieceQty,
                itemLocCode
            );

            if (!stockCheck.available) {
                return NextResponse.json(
                    { error: `สินค้า ${productCode}: ${stockCheck.message}` },
                    { status: 400 }
                );
            }
        }

        const nextLineNo = tx._count.details + 1;

        // Create the detail
        const detail = await prisma.transactionDetail.create({
            data: {
                docNo: tx.docNo,
                lineNo: nextLineNo,
                productCode,
                uomCode,
                uomQty: Number(qty),
                uomRatio: uomRatio || 1,
                pieceQty: itemPieceQty,
                qty: itemPieceQty,
                whCode: tx.whCode,
                locCode: itemLocCode,
                mfgDate: mfgDate ? new Date(mfgDate) : null,
                expDate: expDate ? new Date(expDate) : null,
                lotNo,
                remark,
            }
        });

        // Update future stock
        const direction: "IN" | "OUT" = isOutbound ? "OUT" : "IN";

        await updateFutureStock({
            productCode,
            whCode: tx.whCode,
            locCode: itemLocCode,
            pieceQty: itemPieceQty,
            direction: direction,
            mfgDate: mfgDate ? new Date(mfgDate) : null,
            expDate: expDate ? new Date(expDate) : null,
            docNo: tx.docNo,
            userId: session.user.userId,
        });

        // For Transfer, also update destination warehouse future stock
        if (tx.docTypeCode === "TRN" && tx.toWhCode) {
            await updateFutureStock({
                productCode,
                whCode: tx.toWhCode,
                locCode: itemLocCode,
                pieceQty: itemPieceQty,
                direction: "IN",
                mfgDate: mfgDate ? new Date(mfgDate) : null,
                expDate: expDate ? new Date(expDate) : null,
                docNo: tx.docNo,
                userId: session.user.userId,
            });
        }

        return NextResponse.json(serializeForJSON(detail), { status: 201 });
    } catch (error) {
        console.error("Error adding detail:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to add item" },
            { status: 500 }
        );
    }
}
