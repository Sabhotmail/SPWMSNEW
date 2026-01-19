import { prisma } from "@/lib/prisma";
import { logStockChange } from "@/lib/logging";

interface FutureStockParams {
    productCode: string;
    whCode: string;
    locCode?: string;
    pieceQty: number;
    direction: "IN" | "OUT";
    mfgDate?: Date | null;
    expDate?: Date | null;
    docNo: string;
    userId: string;
}

/**
 * Update future stock when creating/editing/canceling DRAFT documents
 * - IN (รับเข้า): เพิ่ม futureInBal
 * - OUT (จ่ายออก): เพิ่ม futureOutBal
 */
export async function updateFutureStock(params: FutureStockParams) {
    const {
        productCode,
        whCode,
        locCode = "",
        pieceQty,
        direction,
        mfgDate,
        expDate,
        docNo,
        userId
    } = params;

    // Get current stock
    const currentStock = await prisma.stock.findUnique({
        where: { productCode_whCode_locCode: { productCode, whCode, locCode } }
    });

    const currentQty = currentStock ? Number(currentStock.qty) : 0;
    const currentFutureIn = currentStock ? Number(currentStock.futureInBal) : 0;
    const currentFutureOut = currentStock ? Number(currentStock.futureOutBal) : 0;

    // Calculate new values
    const newFutureIn = direction === "IN" ? currentFutureIn + pieceQty : currentFutureIn;
    const newFutureOut = direction === "OUT" ? currentFutureOut + pieceQty : currentFutureOut;

    // Validation: For OUT, check if available stock is sufficient
    if (direction === "OUT") {
        const availableStock = currentQty - currentFutureOut;
        if (pieceQty > availableStock) {
            throw new Error(`สต็อกพร้อมใช้งานของ ${productCode} ในคลัง ${whCode} ไม่เพียงพอ (มี ${availableStock}, ต้องการ ${pieceQty})`);
        }
    }

    // Update Stock table
    await prisma.stock.upsert({
        where: { productCode_whCode_locCode: { productCode, whCode, locCode } },
        update: {
            futureInBal: newFutureIn,
            futureOutBal: newFutureOut,
        },
        create: {
            productCode,
            whCode,
            locCode,
            qty: 0,
            balance: 0,
            futureInBal: direction === "IN" ? pieceQty : 0,
            futureOutBal: direction === "OUT" ? pieceQty : 0,
        }
    });

    // Update StockDate table if MFG/EXP dates are provided
    if (mfgDate && expDate) {
        const currentStockDate = await prisma.stockDate.findUnique({
            where: {
                productCode_whCode_locCode_mfgDate_expDate: {
                    productCode, whCode, locCode, mfgDate, expDate
                }
            }
        });

        const sdFutureIn = currentStockDate ? Number(currentStockDate.futureInBal) : 0;
        const sdFutureOut = currentStockDate ? Number(currentStockDate.futureOutBal) : 0;

        await prisma.stockDate.upsert({
            where: {
                productCode_whCode_locCode_mfgDate_expDate: {
                    productCode, whCode, locCode, mfgDate, expDate
                }
            },
            update: {
                futureInBal: direction === "IN" ? sdFutureIn + pieceQty : sdFutureIn,
                futureOutBal: direction === "OUT" ? sdFutureOut + pieceQty : sdFutureOut,
            },
            create: {
                productCode,
                whCode,
                locCode,
                mfgDate,
                expDate,
                qty: 0,
                balance: 0,
                futureInBal: direction === "IN" ? pieceQty : 0,
                futureOutBal: direction === "OUT" ? pieceQty : 0,
            }
        });
    }

    // Log the future stock change
    await logStockChange({
        functionName: `FUTURE_${direction}`,
        docNo,
        productCode,
        whCode,
        balanceOld: currentQty,
        balanceNew: currentQty, // Balance doesn't change, only future
        pieceQty: direction === "OUT" ? -pieceQty : pieceQty,
        userId,
        futureInBalOld: currentFutureIn,
        futureInBalNew: newFutureIn,
        futureOutBalOld: currentFutureOut,
        futureOutBalNew: newFutureOut,
    });
}

/**
 * Reverse future stock when canceling a DRAFT document
 */
export async function reverseFutureStock(params: FutureStockParams) {
    const {
        productCode,
        whCode,
        locCode = "",
        pieceQty,
        direction,
        mfgDate,
        expDate,
        docNo,
        userId
    } = params;

    const currentStock = await prisma.stock.findUnique({
        where: { productCode_whCode_locCode: { productCode, whCode, locCode } }
    });

    if (!currentStock) return;

    const currentFutureIn = Number(currentStock.futureInBal);
    const currentFutureOut = Number(currentStock.futureOutBal);

    // Reverse: subtract from future
    const newFutureIn = direction === "IN" ? Math.max(0, currentFutureIn - pieceQty) : currentFutureIn;
    const newFutureOut = direction === "OUT" ? Math.max(0, currentFutureOut - pieceQty) : currentFutureOut;

    await prisma.stock.update({
        where: { productCode_whCode_locCode: { productCode, whCode, locCode } },
        data: {
            futureInBal: newFutureIn,
            futureOutBal: newFutureOut,
        }
    });

    // Reverse StockDate if applicable
    if (mfgDate && expDate) {
        const currentStockDate = await prisma.stockDate.findUnique({
            where: {
                productCode_whCode_locCode_mfgDate_expDate: {
                    productCode, whCode, locCode, mfgDate, expDate
                }
            }
        });

        if (currentStockDate) {
            await prisma.stockDate.update({
                where: {
                    productCode_whCode_locCode_mfgDate_expDate: {
                        productCode, whCode, locCode, mfgDate, expDate
                    }
                },
                data: {
                    futureInBal: direction === "IN"
                        ? Math.max(0, Number(currentStockDate.futureInBal) - pieceQty)
                        : undefined,
                    futureOutBal: direction === "OUT"
                        ? Math.max(0, Number(currentStockDate.futureOutBal) - pieceQty)
                        : undefined,
                }
            });
        }
    }

    // Log the reversal
    await logStockChange({
        functionName: `REVERSE_FUTURE_${direction}`,
        docNo,
        productCode,
        whCode,
        balanceOld: Number(currentStock.qty),
        balanceNew: Number(currentStock.qty),
        pieceQty: direction === "OUT" ? pieceQty : -pieceQty,
        userId,
        futureInBalOld: currentFutureIn,
        futureInBalNew: newFutureIn,
        futureOutBalOld: currentFutureOut,
        futureOutBalNew: newFutureOut,
    });
}

/**
 * Get available stock (actual - futureOut + futureIn)
 */
export async function getAvailableStock(productCode: string, whCode: string, locCode: string = "") {
    const stock = await prisma.stock.findUnique({
        where: { productCode_whCode_locCode: { productCode, whCode, locCode } }
    });

    if (!stock) return 0;

    const actualQty = Number(stock.qty);
    const futureIn = Number(stock.futureInBal);
    const futureOut = Number(stock.futureOutBal);

    // Available = Actual - Reserved for outgoing + Expected incoming
    return actualQty - futureOut;
}

/**
 * Check if stock is sufficient for an outgoing transaction
 */
export async function checkStockAvailability(
    productCode: string,
    whCode: string,
    requiredQty: number,
    locCode: string = ""
): Promise<{ available: boolean; currentAvailable: number; message?: string }> {
    const available = await getAvailableStock(productCode, whCode, locCode);

    if (requiredQty > available) {
        return {
            available: false,
            currentAvailable: available,
            message: `สต็อกพร้อมใช้งานไม่เพียงพอ (มี ${available}, ต้องการ ${requiredQty})`
        };
    }

    return { available: true, currentAvailable: available };
}
