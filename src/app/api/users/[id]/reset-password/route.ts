import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const adminResetPasswordSchema = z.object({
    newPassword: z.string().min(6, "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร"),
});

// POST - Admin reset user password
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        // Only admin can reset other users' passwords
        if (!session || session.user.role < 7) {
            return NextResponse.json(
                { error: "ไม่มีสิทธิ์ในการรีเซ็ตรหัสผ่าน" },
                { status: 403 }
            );
        }

        const { id } = await params;
        const body = await request.json();
        const validation = adminResetPasswordSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { newPassword } = validation.data;

        // Find user by ID
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
        });

        if (!user) {
            return NextResponse.json(
                { error: "ไม่พบข้อมูลผู้ใช้" },
                { status: 404 }
            );
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { id: parseInt(id) },
            data: {
                password: hashedPassword,
                passwordDate: new Date(),
            },
        });

        return NextResponse.json(
            {
                message: "รีเซ็ตรหัสผ่านสำเร็จ",
                userId: user.userId,
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
