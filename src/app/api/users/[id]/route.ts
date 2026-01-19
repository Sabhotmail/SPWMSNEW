import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET - Get single user
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || session.user.role < 7) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true,
                userId: true,
                username: true,
                email: true,
                role: true,
                branchCode: true,
                status: true,
                createdAt: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json(
            { error: "Failed to fetch user" },
            { status: 500 }
        );
    }
}

// PUT - Update user
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || session.user.role < 7) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { username, email, role, branchCode, status, password } = body;

        const updateData: any = {
            username,
            email,
            role: parseInt(role),
            branchCode,
            status,
        };

        // Only update password if provided
        if (password && password.trim() !== "") {
            updateData.password = await bcrypt.hash(password, 10);
            updateData.passwordDate = new Date();
        }

        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData,
            select: {
                id: true,
                userId: true,
                username: true,
                email: true,
                role: true,
                branchCode: true,
                status: true,
                createdAt: true,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 }
        );
    }
}

// DELETE - Delete user (soft delete by changing status)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || session.user.role < 9) {
            return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 401 });
        }

        const { id } = await params;

        // Soft delete - just change status to INACTIVE
        await prisma.user.update({
            where: { id: parseInt(id) },
            data: { status: "INACTIVE" },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json(
            { error: "Failed to delete user" },
            { status: 500 }
        );
    }
}
