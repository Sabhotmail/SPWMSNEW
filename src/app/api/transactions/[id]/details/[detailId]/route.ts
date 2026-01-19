import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { serializeForJSON } from "@/lib/serialize";
import { reverseFutureStock, updateFutureStock, checkStockAvailability } from "@/lib/future-stock";

// DELETE - Remove item from transaction
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; detailId: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { detailId } = await params;
        const id = parseInt(detailId);

        // Check if transaction is in DRAFT
        const detail = await prisma.transactionDetail.findUnique({
            where: { id },
            include: {
                header: {
                    include: { documentType: true }
                }
            }
        });

        if (!detail) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }

        if (detail.header.docStatus !== "DRAFT") {
            return NextResponse.json({ error: "Cannot delete items from non-DRAFT transaction" }, { status: 400 });
        }

        // Determine direction
        const isOutbound = detail.header.documentType.movementType === "OUT" || detail.header.docTypeCode === "TRN";
        const direction: "IN" | "OUT" = isOutbound ? "OUT" : "IN";

        // Reverse future stock for this item
        await reverseFutureStock({
            productCode: detail.productCode,
            whCode: detail.header.whCode,
            locCode: detail.locCode || "",
            pieceQty: Number(detail.pieceQty),
            direction: direction,
            mfgDate: detail.mfgDate,
            expDate: detail.expDate,
            docNo: detail.header.docNo,
            userId: session.user.userId,
        });

        // For Transfer, also reverse destination warehouse future stock
        if (detail.header.docTypeCode === "TRN" && detail.header.toWhCode) {
            await reverseFutureStock({
                productCode: detail.productCode,
                whCode: detail.header.toWhCode,
                locCode: detail.locCode || "",
                pieceQty: Number(detail.pieceQty),
                direction: "IN",
                mfgDate: detail.mfgDate,
                expDate: detail.expDate,
                docNo: detail.header.docNo,
                userId: session.user.userId,
            });
        }

        // Delete the detail
        await prisma.transactionDetail.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting detail:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to delete item" },
            { status: 500 }
        );
    }
}

// PATCH - Update item in transaction
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; detailId: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { detailId } = await params;
        const id = parseInt(detailId);
        const body = await request.json();
        const { qty, uomCode, uomRatio, pieceQty, locCode, mfgDate, expDate, lotNo, remark } = body;

        // Check if transaction is in DRAFT
        const detail = await prisma.transactionDetail.findUnique({
            where: { id },
            include: {
                header: {
                    include: { documentType: true }
                }
            }
        });

        if (!detail) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }

        if (detail.header.docStatus !== "DRAFT") {
            return NextResponse.json({ error: "Cannot update items in non-DRAFT transaction" }, { status: 400 });
        }

        const oldPieceQty = Number(detail.pieceQty);
        const newPieceQty = pieceQty !== undefined ? pieceQty : oldPieceQty;
        const qtyDifference = newPieceQty - oldPieceQty;

        const isOutbound = detail.header.documentType.movementType === "OUT" || detail.header.docTypeCode === "TRN";
        const direction: "IN" | "OUT" = isOutbound ? "OUT" : "IN";
        const itemLocCode = locCode !== undefined ? locCode : (detail.locCode || "");

        // For outbound with qty increase, validate stock availability
        if (isOutbound && qtyDifference > 0) {
            const stockCheck = await checkStockAvailability(
                detail.productCode,
                detail.header.whCode,
                qtyDifference,
                itemLocCode
            );

            if (!stockCheck.available) {
                return NextResponse.json(
                    { error: `สินค้า ${detail.productCode}: ${stockCheck.message}` },
                    { status: 400 }
                );
            }
        }

        // Update future stock if qty changed
        if (qtyDifference !== 0) {
            if (qtyDifference > 0) {
                // Increase: add more future
                await updateFutureStock({
                    productCode: detail.productCode,
                    whCode: detail.header.whCode,
                    locCode: itemLocCode,
                    pieceQty: qtyDifference,
                    direction: direction,
                    mfgDate: mfgDate ? new Date(mfgDate) : detail.mfgDate,
                    expDate: expDate ? new Date(expDate) : detail.expDate,
                    docNo: detail.header.docNo,
                    userId: session.user.userId,
                });
            } else {
                // Decrease: reverse some future
                await reverseFutureStock({
                    productCode: detail.productCode,
                    whCode: detail.header.whCode,
                    locCode: itemLocCode,
                    pieceQty: Math.abs(qtyDifference),
                    direction: direction,
                    mfgDate: mfgDate ? new Date(mfgDate) : detail.mfgDate,
                    expDate: expDate ? new Date(expDate) : detail.expDate,
                    docNo: detail.header.docNo,
                    userId: session.user.userId,
                });
            }

            // For Transfer, also update destination warehouse
            if (detail.header.docTypeCode === "TRN" && detail.header.toWhCode) {
                if (qtyDifference > 0) {
                    await updateFutureStock({
                        productCode: detail.productCode,
                        whCode: detail.header.toWhCode,
                        locCode: itemLocCode,
                        pieceQty: qtyDifference,
                        direction: "IN",
                        mfgDate: mfgDate ? new Date(mfgDate) : detail.mfgDate,
                        expDate: expDate ? new Date(expDate) : detail.expDate,
                        docNo: detail.header.docNo,
                        userId: session.user.userId,
                    });
                } else {
                    await reverseFutureStock({
                        productCode: detail.productCode,
                        whCode: detail.header.toWhCode,
                        locCode: itemLocCode,
                        pieceQty: Math.abs(qtyDifference),
                        direction: "IN",
                        mfgDate: mfgDate ? new Date(mfgDate) : detail.mfgDate,
                        expDate: expDate ? new Date(expDate) : detail.expDate,
                        docNo: detail.header.docNo,
                        userId: session.user.userId,
                    });
                }
            }
        }

        const updatedDetail = await prisma.transactionDetail.update({
            where: { id },
            data: {
                uomQty: qty !== undefined ? Number(qty) : undefined,
                uomCode,
                uomRatio,
                pieceQty: pieceQty !== undefined ? pieceQty : undefined,
                qty: pieceQty !== undefined ? pieceQty : undefined,
                locCode: locCode !== undefined ? locCode : undefined,
                mfgDate: mfgDate ? new Date(mfgDate) : undefined,
                expDate: expDate ? new Date(expDate) : undefined,
                lotNo,
                remark,
            }
        });

        return NextResponse.json(serializeForJSON(updatedDetail));
    } catch (error) {
        console.error("Error updating detail:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to update item" },
            { status: 500 }
        );
    }
}
