import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { code } = await params;
        const locations = await prisma.location.findMany({
            where: {
                whCode: code,
                status: "ACTIVE"
            },
            orderBy: { locCode: "asc" }
        });

        return NextResponse.json(locations);
    } catch (error) {
        console.error("Error fetching locations:", error);
        return NextResponse.json(
            { error: "Failed to fetch locations" },
            { status: 500 }
        );
    }
}
