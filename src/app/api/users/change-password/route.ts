import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "กรุณากรอกรหัสผ่านปัจจุบัน"),
    newPassword: z.string().min(6, "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร"),
    confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่านใหม่"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "รหัสผ่านใหม่ไม่ตรงกัน",
    path: ["confirmPassword"],
});

// POST - Change password
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { error: "กรุณาเข้าสู่ระบบ" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validation = changePasswordSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { currentPassword, newPassword } = validation.data;

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { userId: session.user.userId },
        });

        if (!user) {
            return NextResponse.json(
                { error: "ไม่พบข้อมูลผู้ใช้" },
                { status: 404 }
            );
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isValidPassword) {
            return NextResponse.json(
                { error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" },
                { status: 400 }
            );
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { userId: session.user.userId },
            data: {
                password: hashedPassword,
                passwordDate: new Date(),
            },
        });

        return NextResponse.json(
            { message: "เปลี่ยนรหัสผ่านสำเร็จ" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error changing password:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน" },
            { status: 500 }
        );
    }
}
