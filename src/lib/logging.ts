// Logging utility for activity and stock logs
import { prisma } from "./prisma";

export type ActivityAction =
    | "LOGIN"
    | "LOGOUT"
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "APPROVE"
    | "CANCEL"
    | "VIEW";

export type ActivityModule =
    | "TRANSACTION"
    | "PRODUCT"
    | "WAREHOUSE"
    | "USER"
    | "STOCK"
    | "MASTER"
    | "REPORT";

interface ActivityLogInput {
    userId: string;
    username: string;
    action: ActivityAction;
    module: ActivityModule;
    docNo?: string;
    description?: string;
    ipAddress?: string;
    userAgent?: string;
    oldValue?: object;
    newValue?: object;
}

interface StockLogInput {
    functionName: string;
    docNo: string;
    productCode: string;
    whCode: string;
    balanceOld: number;
    futureInBalOld: number;
    futureOutBalOld: number;
    pieceQty: number;
    balanceNew: number;
    futureInBalNew: number;
    futureOutBalNew: number;
    userId: string;
}

/**
 * บันทึก Activity Log
 */
export async function logActivity(input: ActivityLogInput) {
    try {
        await prisma.activityLog.create({
            data: {
                userId: input.userId,
                username: input.username,
                action: input.action,
                module: input.module,
                docNo: input.docNo,
                description: input.description,
                ipAddress: input.ipAddress,
                userAgent: input.userAgent,
                oldValue: input.oldValue ? JSON.stringify(input.oldValue) : null,
                newValue: input.newValue ? JSON.stringify(input.newValue) : null,
            },
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
        // Don't throw - logging should not break the main flow
    }
}

/**
 * บันทึก Stock Log
 */
export async function logStockChange(input: StockLogInput) {
    try {
        await prisma.stockLog.create({
            data: {
                functionName: input.functionName,
                docNo: input.docNo,
                productCode: input.productCode,
                whCode: input.whCode,
                balanceOld: input.balanceOld,
                futureInBalOld: input.futureInBalOld,
                futureOutBalOld: input.futureOutBalOld,
                pieceQty: input.pieceQty,
                balanceNew: input.balanceNew,
                futureInBalNew: input.futureInBalNew,
                futureOutBalNew: input.futureOutBalNew,
                createdUserId: input.userId,
                updatedUserId: input.userId,
            },
        });
    } catch (error) {
        console.error("Failed to log stock change:", error);
        // Don't throw - logging should not break the main flow
    }
}

/**
 * ดึง Activity Logs ล่าสุด
 */
export async function getActivityLogs(limit = 100, module?: ActivityModule) {
    return prisma.activityLog.findMany({
        where: module ? { module } : undefined,
        orderBy: { createdAt: "desc" },
        take: limit,
    });
}

/**
 * ดึง Stock Logs ตาม docNo หรือ productCode
 */
export async function getStockLogs(options: {
    docNo?: string;
    productCode?: string;
    limit?: number;
}) {
    const { docNo, productCode, limit = 100 } = options;
    const where: any = {};

    if (docNo) where.docNo = docNo;
    if (productCode) where.productCode = productCode;

    return prisma.stockLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
    });
}
