import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const resetPasswordSchema = z.object({
    userId: z.string().min(1, "กรุณากรอกรหัสผู้ใช้"),
    email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง").optional().or(z.literal("")),
    newPassword: z.string().min(6, "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร"),
    confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่านใหม่"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "รหัสผ่านใหม่ไม่ตรงกัน",
    path: ["confirmPassword"],
});

// POST - Reset password (for admin or self-service with verification)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = resetPasswordSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { userId, email, newPassword } = validation.data;

        // Find user by userId
        const user = await prisma.user.findUnique({
            where: {
                userId: userId.toUpperCase(),
            },
        });

        if (!user || user.status !== "ACTIVE") {
            return NextResponse.json(
                { error: "ไม่พบข้อมูลผู้ใช้หรือบัญชีถูกปิดใช้งาน" },
                { status: 404 }
            );
        }

        // Verify email if provided (additional security)
        if (email && user.email && user.email.toLowerCase() !== email.toLowerCase()) {
            return NextResponse.json(
                { error: "อีเมลไม่ตรงกับข้อมูลในระบบ" },
                { status: 400 }
            );
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { userId: user.userId },
            data: {
                password: hashedPassword,
                passwordDate: new Date(),
            },
        });

        return NextResponse.json(
            {
                message: "รีเซ็ตรหัสผ่านสำเร็จ",
                userId: user.userId
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error resetting password:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน" },
            { status: 500 }
        );
    }
}
