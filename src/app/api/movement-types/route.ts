import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - List all movement types
export async function GET() {
    try {
        const types = await prisma.movementType.findMany({
            where: { status: "ACTIVE" },
            orderBy: { movementTypeCode: "asc" },
        });

        return NextResponse.json(types);
    } catch (error) {
        console.error("Error fetching movement types:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการดึงข้อมูล Movement Types" },
            { status: 500 }
        );
    }
}

// POST - Create new movement type
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        // Check authorization - Only admin (role >= 7) can create
        if (!session || session.user.role < 7) {
            return NextResponse.json(
                { error: "ไม่มีสิทธิ์ในการสร้าง Movement Type" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { movementTypeCode, movementTypeName, direction } = body;

        // Validation
        if (!movementTypeCode || !movementTypeName || !direction) {
            return NextResponse.json(
                { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
                { status: 400 }
            );
        }

        // Validate direction
        if (direction !== "IN" && direction !== "OUT") {
            return NextResponse.json(
                { error: "Direction ต้องเป็น IN หรือ OUT เท่านั้น" },
                { status: 400 }
            );
        }

        // Check duplicate
        const existing = await prisma.movementType.findUnique({
            where: { movementTypeCode },
        });

        if (existing) {
            return NextResponse.json(
                { error: "Movement Type Code นี้มีอยู่ในระบบแล้ว" },
                { status: 409 }
            );
        }

        // Create new movement type
        const newType = await prisma.movementType.create({
            data: {
                movementTypeCode: movementTypeCode.toUpperCase(),
                movementTypeName,
                direction,
                status: "ACTIVE",
            },
        });

        return NextResponse.json(newType, { status: 201 });
    } catch (error) {
        console.error("Error creating movement type:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการสร้าง Movement Type" },
            { status: 500 }
        );
    }
}
