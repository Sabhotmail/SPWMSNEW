import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { serializeForJSON } from "@/lib/serialize";
import { logActivity, logStockChange } from "@/lib/logging";
import { reverseFutureStock } from "@/lib/future-stock";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        // Only Managers or Admins can approve (Role >= 7)
        if (!session || session.user.role < 7) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const txId = parseInt(id);

        // Pre-check (for early 404 response, but NOT for race condition prevention)
        const txPreCheck = await prisma.transactionHeader.findUnique({
            where: { id: txId },
            include: { details: true, documentType: true },
        });

        if (!txPreCheck) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        // Process Approval with Prisma Transaction + Row Locking
        const result = await prisma.$transaction(async (txPrisma) => {
            // 🔒 CRITICAL: Lock the row with FOR UPDATE to prevent race condition
            const lockedTx = await txPrisma.$queryRaw<Array<{ id: number; doc_status: string }>>`
                SELECT id, doc_status FROM transaction_headers 
                WHERE id = ${txId} 
                FOR UPDATE
            `;

            if (!lockedTx || lockedTx.length === 0) {
                throw new Error("Transaction not found");
            }

            // ✅ Check status INSIDE transaction (after locking)
            if (lockedTx[0].doc_status !== "DRAFT") {
                throw new Error("Can only approve DRAFT documents (document may have been approved by another user)");
            }

            // Re-fetch full data inside transaction
            const tx = await txPrisma.transactionHeader.findUnique({
                where: { id: txId },
                include: { details: true, documentType: true },
            });

            if (!tx) {
                throw new Error("Transaction not found");
            }

            // 1. Update Header Status
            const updatedHeader = await txPrisma.transactionHeader.update({
                where: { id: txId },
                data: {
                    docStatus: "APPROVED",
                    docState: "CLOSED",
                    approvedBy: session.user.userId,
                    approvedAt: new Date(),
                },
            });

            // 2. Update Stock for each detail item
            for (const item of tx.details) {
                const isTransfer = tx.docTypeCode === "TRN";
                // Get the actual movement type from DB if movementTypeCode is present
                let direction = tx.documentType.movementType;
                if (item.movementTypeCode) {
                    const mt = await txPrisma.movementType.findUnique({
                        where: { movementTypeCode: item.movementTypeCode }
                    });
                    if (mt) direction = mt.direction;
                } else if (tx.movementTypeCode) {
                    const mt = await txPrisma.movementType.findUnique({
                        where: { movementTypeCode: tx.movementTypeCode }
                    });
                    if (mt) direction = mt.direction;
                }

                const isOutbound = direction === "OUT" || isTransfer;
                const movementMultiplier = direction === "IN" ? 1 : -1;
                const changeQty = Number(item.pieceQty) * movementMultiplier;

                // Default dates for stock tracking
                const mfgDate = item.mfgDate || new Date('2099-09-09');
                const expDate = item.expDate || new Date('2099-09-09');
                const itemLocCode = item.locCode || "";

                // Function to update stock (summary table)
                const updateStock = async (wh: string, loc: string, qty: number) => {
                    // Validation for outbound
                    if (qty < 0) {
                        const existingStock = await txPrisma.stock.findUnique({
                            where: { productCode_whCode_locCode: { productCode: item.productCode, whCode: wh, locCode: loc } },
                        });
                        const currentQty = existingStock ? Number(existingStock.qty) : 0;
                        if (currentQty < Math.abs(qty)) {
                            throw new Error(`สต๊อกสินค้า ${item.productCode} ในคลัง ${wh} (Loc: ${loc || "-"}) ไม่เพียงพอ (มีอยู่ ${currentQty})`);
                        }
                    }

                    // Get current stock to calculate future balance changes
                    const existingStockForFuture = await txPrisma.stock.findUnique({
                        where: { productCode_whCode_locCode: { productCode: item.productCode, whCode: wh, locCode: loc } }
                    });

                    const currentFutureIn = existingStockForFuture ? Number(existingStockForFuture.futureInBal) : 0;
                    const currentFutureOut = existingStockForFuture ? Number(existingStockForFuture.futureOutBal) : 0;

                    // Calculate new future balances (decrement by the approved qty)
                    const newFutureIn = qty > 0 ? Math.max(0, currentFutureIn - Math.abs(qty)) : currentFutureIn;
                    const newFutureOut = qty < 0 ? Math.max(0, currentFutureOut - Math.abs(qty)) : currentFutureOut;

                    await txPrisma.stock.upsert({
                        where: { productCode_whCode_locCode: { productCode: item.productCode, whCode: wh, locCode: loc } },
                        update: {
                            qty: { increment: qty },
                            balance: { increment: qty },
                            futureInBal: newFutureIn,
                            futureOutBal: newFutureOut,
                            lastMoveDate: new Date(),
                            lastInDate: qty > 0 ? new Date() : undefined,
                            lastOutDate: qty < 0 ? new Date() : undefined,
                        },
                        create: {
                            productCode: item.productCode,
                            whCode: wh,
                            locCode: loc,
                            qty: qty,
                            balance: qty,
                            futureInBal: 0,
                            futureOutBal: 0,
                            firstInDate: qty > 0 ? new Date() : undefined,
                            firstOutDate: qty < 0 ? new Date() : undefined,
                            lastInDate: qty > 0 ? new Date() : undefined,
                            lastOutDate: qty < 0 ? new Date() : undefined,
                            lastMoveDate: new Date(),
                        },
                    });
                };


                // Function to update or create stock date entry
                const updateStockDate = async (wh: string, loc: string, qty: number, mfg: Date, exp: Date) => {
                    // Get current stock date to calculate future balance changes
                    const existingSD = await txPrisma.stockDate.findUnique({
                        where: {
                            productCode_whCode_locCode_mfgDate_expDate: {
                                productCode: item.productCode,
                                whCode: wh,
                                locCode: loc,
                                mfgDate: mfg,
                                expDate: exp,
                            }
                        }
                    });

                    const sdFutureIn = existingSD ? Number(existingSD.futureInBal) : 0;
                    const sdFutureOut = existingSD ? Number(existingSD.futureOutBal) : 0;

                    const newSDFutureIn = qty > 0 ? Math.max(0, sdFutureIn - Math.abs(qty)) : sdFutureIn;
                    const newSDFutureOut = qty < 0 ? Math.max(0, sdFutureOut - Math.abs(qty)) : sdFutureOut;

                    await txPrisma.stockDate.upsert({
                        where: {
                            productCode_whCode_locCode_mfgDate_expDate: {
                                productCode: item.productCode,
                                whCode: wh,
                                locCode: loc,
                                mfgDate: mfg,
                                expDate: exp,
                            }
                        },
                        update: {
                            qty: { increment: qty },
                            balance: { increment: qty },
                            futureInBal: newSDFutureIn,
                            futureOutBal: newSDFutureOut,
                            lastMoveDate: new Date(),
                        },
                        create: {
                            productCode: item.productCode,
                            whCode: wh,
                            locCode: loc,
                            mfgDate: mfg,
                            expDate: exp,
                            qty: qty,
                            balance: qty,
                            futureInBal: 0,
                            futureOutBal: 0,
                            firstInDate: qty > 0 ? new Date() : undefined,
                            lastMoveDate: new Date(),
                        },
                    });
                };

                // FEFO/FIFO/LIFO allocation for outbound
                const allocateWithFEFO = async (wh: string, loc: string, qtyNeeded: number) => {
                    // Get product's stock control method
                    const product = await txPrisma.product.findUnique({
                        where: { productCode: item.productCode },
                        select: { stockControl: true }
                    });
                    const stockControl = product?.stockControl || 'FEFO';

                    // Determine sort order based on stock control method
                    let orderBy: any;
                    if (stockControl === 'FEFO') {
                        orderBy = { expDate: 'asc' }; // First Expired, First Out
                    } else if (stockControl === 'FIFO') {
                        orderBy = { mfgDate: 'asc' }; // First In (oldest MFG), First Out
                    } else { // LIFO
                        orderBy = { mfgDate: 'desc' }; // Last In (newest MFG), First Out
                    }

                    // Get all stock dates sorted by the control method
                    const stockDates = await txPrisma.stockDate.findMany({
                        where: {
                            productCode: item.productCode,
                            whCode: wh,
                            locCode: loc,
                            qty: { gt: 0 }
                        },
                        orderBy: orderBy
                    });

                    let remaining = qtyNeeded;
                    for (const sd of stockDates) {
                        if (remaining <= 0) break;

                        const available = Number(sd.qty);
                        const toDeduct = Math.min(available, remaining);

                        // Deduct from this stock date entry
                        await updateStockDate(wh, loc, -toDeduct, sd.mfgDate, sd.expDate);
                        remaining -= toDeduct;
                    }

                    if (remaining > 0) {
                        throw new Error(`สต๊อกสินค้า ${item.productCode} ไม่เพียงพอ (ขาดอีก ${remaining} ชิ้น)`);
                    }
                };

                if (isTransfer) {
                    // Transfer: Decrement from source, Increment to destination
                    // Source: Use FEFO allocation

                    // Get old balance for source
                    const oldStockSource = await txPrisma.stock.findUnique({
                        where: { productCode_whCode_locCode: { productCode: item.productCode, whCode: tx.whCode, locCode: item.locCode || "" } }
                    });
                    const balanceOldSource = oldStockSource ? Number(oldStockSource.qty) : 0;

                    await allocateWithFEFO(tx.whCode, itemLocCode, Number(item.pieceQty));
                    await updateStock(tx.whCode, itemLocCode, -Number(item.pieceQty));

                    // Log Source Outbound
                    await logStockChange({
                        functionName: "APPROVE_TRANSFER_OUT",
                        docNo: tx.docNo,
                        productCode: item.productCode,
                        whCode: tx.whCode,
                        balanceOld: balanceOldSource,
                        balanceNew: balanceOldSource - Number(item.pieceQty),
                        pieceQty: -Number(item.pieceQty),
                        userId: session.user.userId,
                        futureInBalOld: 0, futureInBalNew: 0, futureOutBalOld: 0, futureOutBalNew: 0
                    });

                    // Destination: Add with original MFG/EXP dates
                    if (tx.toWhCode) {
                        const oldStockDest = await txPrisma.stock.findUnique({
                            where: { productCode_whCode_locCode: { productCode: item.productCode, whCode: tx.toWhCode, locCode: itemLocCode } }
                        });
                        const balanceOldDest = oldStockDest ? Number(oldStockDest.qty) : 0;

                        await updateStock(tx.toWhCode, itemLocCode, Number(item.pieceQty));
                        await updateStockDate(tx.toWhCode, itemLocCode, Number(item.pieceQty), mfgDate, expDate);

                        // Log Destination Inbound
                        await logStockChange({
                            functionName: "APPROVE_TRANSFER_IN",
                            docNo: tx.docNo,
                            productCode: item.productCode,
                            whCode: tx.toWhCode,
                            balanceOld: balanceOldDest,
                            balanceNew: balanceOldDest + Number(item.pieceQty),
                            pieceQty: Number(item.pieceQty),
                            userId: session.user.userId,
                            futureInBalOld: 0, futureInBalNew: 0, futureOutBalOld: 0, futureOutBalNew: 0
                        });
                    }
                } else {
                    // Goods Receipt or Goods Issue
                    const oldStock = await txPrisma.stock.findUnique({
                        where: { productCode_whCode_locCode: { productCode: item.productCode, whCode: tx.whCode, locCode: itemLocCode } }
                    });
                    const balanceOld = oldStock ? Number(oldStock.qty) : 0;

                    if (isOutbound) {
                        await allocateWithFEFO(tx.whCode, itemLocCode, Number(item.pieceQty));
                        await updateStock(tx.whCode, itemLocCode, changeQty);
                    } else {
                        await updateStock(tx.whCode, itemLocCode, changeQty);
                        await updateStockDate(tx.whCode, itemLocCode, changeQty, mfgDate, expDate);
                    }

                    // Log the movement
                    await logStockChange({
                        functionName: isOutbound ? "APPROVE_OUT" : "APPROVE_IN",
                        docNo: tx.docNo,
                        productCode: item.productCode,
                        whCode: tx.whCode,
                        balanceOld: balanceOld,
                        balanceNew: balanceOld + changeQty,
                        pieceQty: changeQty,
                        userId: session.user.userId,
                        futureInBalOld: 0, futureInBalNew: 0, futureOutBalOld: 0, futureOutBalNew: 0
                    });
                }
            }

            return updatedHeader;
        });

        // Log the approval activity
        await logActivity({
            userId: session.user.userId,
            username: session.user.name || session.user.userId,
            action: "APPROVE",
            module: "TRANSACTION",
            docNo: txPreCheck.docNo,
            description: `อนุมัติเอกสาร ${txPreCheck.docNo} (${txPreCheck.documentType.docTypeName})`,
        });

        return NextResponse.json(serializeForJSON(result));
    } catch (error) {
        console.error("Approval error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to approve transaction" },
            { status: 500 }
        );
    }
}

