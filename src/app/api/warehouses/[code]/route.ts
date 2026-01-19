import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { code } = await params;
        const body = await req.json();
        const { whCode, whName, branchCode, status } = body;

        const updated = await prisma.warehouse.update({
            where: { id: parseInt(code) },
            data: {
                whCode,
                whName,
                branchCode,
                status,
                updatedUserId: session.user.id,
            },
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("Error updating warehouse:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update warehouse" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only admins can delete
        if (session.user.role < 7) {
            return NextResponse.json({ error: "Permission denied" }, { status: 403 });
        }

        const { code } = await params;

        // Check if there are active stocks or transactions
        const stockCount = await prisma.stock.count({
            where: { warehouse: { id: parseInt(code) } },
        });

        if (stockCount > 0) {
            return NextResponse.json(
                { error: "Cannot delete warehouse with active stocks. Please move or clear stocks first." },
                { status: 400 }
            );
        }

        // Soft delete by setting status to INACTIVE
        const deleted = await prisma.warehouse.update({
            where: { id: parseInt(code) },
            data: {
                status: "INACTIVE",
                updatedUserId: session.user.id,
            },
        });

        return NextResponse.json(deleted);
    } catch (error: any) {
        console.error("Error deleting warehouse:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete warehouse" },
            { status: 500 }
        );
    }
}
