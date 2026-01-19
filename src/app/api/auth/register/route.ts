import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
    userId: z.string().min(1, "กรุณากรอกรหัสผู้ใช้"),
    username: z.string().min(1, "กรุณากรอกชื่อ"),
    email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง").optional().or(z.literal("")),
    password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
    confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่าน"),
    branchCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = registerSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { userId, username, email, password, branchCode } = validation.data;

        // Check if userId already exists
        const existingUser = await prisma.user.findUnique({
            where: { userId: userId.toUpperCase() },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "รหัสผู้ใช้นี้มีอยู่แล้ว" },
                { status: 409 }
            );
        }

        // Check if email already exists (if provided)
        if (email) {
            const existingEmail = await prisma.user.findFirst({
                where: { email: email },
            });

            if (existingEmail) {
                return NextResponse.json(
                    { error: "อีเมลนี้ถูกใช้งานแล้ว" },
                    { status: 409 }
                );
            }
        }

        // Verify branch exists (if provided)
        if (branchCode) {
            const branch = await prisma.branch.findUnique({
                where: { branchCode: branchCode },
            });

            if (!branch) {
                return NextResponse.json(
                    { error: "ไม่พบข้อมูลสาขาที่เลือก" },
                    { status: 400 }
                );
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user with default role = 1 (User)
        const user = await prisma.user.create({
            data: {
                userId: userId.toUpperCase(),
                username,
                password: hashedPassword,
                email: email || null,
                role: 1, // Default role
                ...(branchCode ? { branchCode } : {}),
                status: "ACTIVE",
                passwordDate: new Date(),
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

        return NextResponse.json(
            {
                message: "ลงทะเบียนสำเร็จ",
                user,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error registering user:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการลงทะเบียน" },
            { status: 500 }
        );
    }
}
