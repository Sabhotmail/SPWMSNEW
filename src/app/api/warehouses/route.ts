import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { serializeForJSON } from "@/lib/serialize";

// GET - List all warehouses
export async function GET() {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const warehouses = await prisma.warehouse.findMany({
            where: { status: "ACTIVE" },
            include: {
                locations: {
                    where: { status: "ACTIVE" },
                },
                _count: {
                    select: { stocks: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(serializeForJSON(warehouses));
    } catch (error) {
        console.error("Error fetching warehouses:", error);
        return NextResponse.json(
            { error: "Failed to fetch warehouses" },
            { status: 500 }
        );
    }
}

// POST - Create new warehouse
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { whCode, whName, branchCode } = body;

        const existing = await prisma.warehouse.findUnique({
            where: { whCode: whCode.toUpperCase() },
        });

        if (existing) {
            return NextResponse.json(
                { error: "รหัสคลังนี้มีอยู่แล้ว" },
                { status: 409 }
            );
        }

        const warehouse = await prisma.warehouse.create({
            data: {
                whCode: whCode.toUpperCase(),
                whName,
                branchCode,
                status: "ACTIVE",
            },
        });

        return NextResponse.json(serializeForJSON(warehouse), { status: 201 });
    } catch (error) {
        console.error("Error creating warehouse:", error);
        return NextResponse.json(
            { error: "Failed to create warehouse" },
            { status: 500 }
        );
    }
}
