import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { serializeForJSON } from "@/lib/serialize";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const now = new Date();
        const thirtyDaysFromNow = new Date(now);
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        const sixtyDaysFromNow = new Date(now);
        sixtyDaysFromNow.setDate(now.getDate() + 60);

        const ninetyDaysFromNow = new Date(now);
        ninetyDaysFromNow.setDate(now.getDate() + 90);

        // Query stock dates that will expire soon
        const stockDates = await prisma.stockDate.findMany({
            where: {
                balance: { gt: 0 },
                expDate: {
                    lte: ninetyDaysFromNow,
                    gte: now,
                },
            },
            include: {
                product: {
                    select: {
                        productCode: true,
                        productName: true,
                    },
                },
                warehouse: {
                    select: {
                        whCode: true,
                        whName: true,
                    },
                },
            },
            orderBy: {
                expDate: "asc",
            },
        });

        // Categorize by severity
        const critical = stockDates.filter(
            (item) => item.expDate <= thirtyDaysFromNow
        );
        const warning = stockDates.filter(
            (item) =>
                item.expDate > thirtyDaysFromNow && item.expDate <= sixtyDaysFromNow
        );
        const info = stockDates.filter(
            (item) =>
                item.expDate > sixtyDaysFromNow && item.expDate <= ninetyDaysFromNow
        );

        return NextResponse.json(serializeForJSON({
            critical: critical.map((item) => ({
                id: item.id,
                productCode: item.product.productCode,
                productName: item.product.productName,
                whCode: item.warehouse.whCode,
                whName: item.warehouse.whName,
                balance: item.balance,
                mfgDate: item.mfgDate,
                expDate: item.expDate,
                daysUntilExpiry: Math.ceil(
                    (item.expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                ),
            })),
            warning: warning.map((item) => ({
                id: item.id,
                productCode: item.product.productCode,
                productName: item.product.productName,
                whCode: item.warehouse.whCode,
                whName: item.warehouse.whName,
                balance: item.balance,
                mfgDate: item.mfgDate,
                expDate: item.expDate,
                daysUntilExpiry: Math.ceil(
                    (item.expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                ),
            })),
            info: info.map((item) => ({
                id: item.id,
                productCode: item.product.productCode,
                productName: item.product.productName,
                whCode: item.warehouse.whCode,
                whName: item.warehouse.whName,
                balance: item.balance,
                mfgDate: item.mfgDate,
                expDate: item.expDate,
                daysUntilExpiry: Math.ceil(
                    (item.expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                ),
            })),
        }));
    } catch (error) {
        console.error("Error fetching expiry warnings:", error);
        return NextResponse.json(
            { error: "Failed to fetch expiry warnings" },
            { status: 500 }
        );
    }
}
