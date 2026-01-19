import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET - List all Document Types
export async function GET() {
    try {
        const docTypes = await prisma.documentType.findMany({
            orderBy: { docTypeCode: "asc" },
        });
        return NextResponse.json(docTypes);
    } catch (error) {
        console.error("Error fetching document types:", error);
        return NextResponse.json({ error: "Failed to fetch document types" }, { status: 500 });
    }
}

// POST - Create new Document Type
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || (session.user as any).role < 7) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { docTypeCode, docTypeName, movementType } = body;

        if (!docTypeCode || !docTypeName || !movementType) {
            return NextResponse.json({ error: "docTypeCode, docTypeName, and movementType are required" }, { status: 400 });
        }

        const docType = await prisma.documentType.create({
            data: {
                docTypeCode,
                docTypeName,
                movementType,
                status: "ACTIVE",
            },
        });

        return NextResponse.json(docType, { status: 201 });
    } catch (error: any) {
        if (error.code === "P2002") {
            return NextResponse.json({ error: "Document type code already exists" }, { status: 409 });
        }
        console.error("Error creating document type:", error);
        return NextResponse.json({ error: "Failed to create document type" }, { status: 500 });
    }
}
