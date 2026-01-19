import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET - List all Principals
export async function GET() {
    try {
        const principals = await prisma.principal.findMany({
            orderBy: { principalCode: "asc" },
        });
        return NextResponse.json(principals);
    } catch (error) {
        console.error("Error fetching principals:", error);
        return NextResponse.json({ error: "Failed to fetch principals" }, { status: 500 });
    }
}

// POST - Create new Principal
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { principalCode, principalName } = body;

        if (!principalCode || !principalName) {
            return NextResponse.json({ error: "principalCode and principalName are required" }, { status: 400 });
        }

        const principal = await prisma.principal.create({
            data: {
                principalCode,
                principalName,
                status: "ACTIVE",
            },
        });

        return NextResponse.json(principal, { status: 201 });
    } catch (error: any) {
        if (error.code === "P2002") {
            return NextResponse.json({ error: "Principal code already exists" }, { status: 409 });
        }
        console.error("Error creating principal:", error);
        return NextResponse.json({ error: "Failed to create principal" }, { status: 500 });
    }
}
