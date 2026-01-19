import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET - List all UOMs
export async function GET() {
    try {
        const uoms = await prisma.uOM.findMany({
            orderBy: { uomCode: "asc" },
        });
        return NextResponse.json(uoms);
    } catch (error) {
        console.error("Error fetching UOMs:", error);
        return NextResponse.json({ error: "Failed to fetch UOMs" }, { status: 500 });
    }
}

// POST - Create new UOM
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { uomCode, uomName } = body;

        if (!uomCode || !uomName) {
            return NextResponse.json({ error: "uomCode and uomName are required" }, { status: 400 });
        }

        const uom = await prisma.uOM.create({
            data: {
                uomCode,
                uomName,
                status: "ACTIVE",
            },
        });

        return NextResponse.json(uom, { status: 201 });
    } catch (error: any) {
        if (error.code === "P2002") {
            return NextResponse.json({ error: "UOM code already exists" }, { status: 409 });
        }
        console.error("Error creating UOM:", error);
        return NextResponse.json({ error: "Failed to create UOM" }, { status: 500 });
    }
}
