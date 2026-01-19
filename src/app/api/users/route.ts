import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET - List all users
export async function GET() {
    try {
        const session = await auth();
        if (!session || session.user.role < 7) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const users = await prisma.user.findMany({
            where: { status: "ACTIVE" },
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
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}

// POST - Create new user
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user.role < 7) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { userId, username, password, email, role, branchCode } = body;

        const existing = await prisma.user.findUnique({
            where: { userId: userId.toUpperCase() },
        });

        if (existing) {
            return NextResponse.json(
                { error: "รหัสผู้ใช้นี้มีอยู่แล้ว" },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                userId: userId.toUpperCase(),
                username,
                password: hashedPassword,
                email,
                role: parseInt(role),
                branchCode,
                status: "ACTIVE",
            },
            select: {
                id: true,
                userId: true,
                username: true,
                email: true,
                role: true,
                branchCode: true,
                status: true,
            },
        });

        return NextResponse.json(user, { status: 201 });
    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json(
            { error: "Failed to create user" },
            { status: 500 }
        );
    }
}
