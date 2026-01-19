import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { serializeForJSON } from "@/lib/serialize";

// GET - Fetch available stock dates for a product in a warehouse
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: productCode } = await params;
        const { searchParams } = new URL(request.url);
        const whCode = searchParams.get("whCode");

        if (!whCode) {
            return NextResponse.json({ error: "whCode is required" }, { status: 400 });
        }

        // Get all stock dates with qty > 0, sorted by expDate (FEFO)
        const stockDates = await prisma.stockDate.findMany({
            where: {
                productCode,
                whCode,
                qty: { gt: 0 }
            },
            orderBy: { expDate: 'asc' },
            select: {
                id: true,
                mfgDate: true,
                expDate: true,
                qty: true,
                locCode: true,
            }
        });

        return NextResponse.json({
            stockDates: serializeForJSON(stockDates)
        });
    } catch (error) {
        console.error("Error fetching stock dates:", error);
        return NextResponse.json({ error: "Failed to fetch stock dates" }, { status: 500 });
    }
}
