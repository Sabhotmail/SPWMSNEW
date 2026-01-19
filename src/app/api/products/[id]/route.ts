import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { serializeForJSON } from "@/lib/serialize";

// GET - Get single product
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
            include: {
                principal: true,
                brand: true,
                productUOMs: {
                    include: { uom: true },
                },
            },
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json(serializeForJSON(product));
    } catch (error) {
        console.error("Error fetching product:", error);
        return NextResponse.json(
            { error: "Failed to fetch product" },
            { status: 500 }
        );
    }
}

// PUT - Update product
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const {
            productName, principalProductCode,
            pieceBarcode, packBarcode, innerBarcode, caseBarcode,
            shelfLife, reorderPoint, stockControl,
            caseWeight, caseWidth, caseLength, caseHeight, caseVolume,
            principalCode, brandCode, baseUomCode, status
        } = body;

        const product = await prisma.product.update({
            where: { id: parseInt(id) },
            data: {
                productName,
                principalProductCode,
                pieceBarcode,
                packBarcode,
                innerBarcode,
                caseBarcode,
                shelfLife: shelfLife || 0,
                reorderPoint: reorderPoint || 0,
                stockControl: stockControl || "FEFO",
                caseWeight: caseWeight || 0,
                caseWidth: caseWidth || 0,
                caseLength: caseLength || 0,
                caseHeight: caseHeight || 0,
                caseVolume: caseVolume || 0,
                principalCode,
                brandCode,
                baseUomCode,
                status,
            },
            include: {
                principal: true,
                brand: true,
            },
        });

        return NextResponse.json(serializeForJSON(product));
    } catch (error) {
        console.error("Error updating product:", error);
        return NextResponse.json(
            { error: "Failed to update product" },
            { status: 500 }
        );
    }
}

// DELETE - Soft delete product
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Soft delete
        await prisma.product.update({
            where: { id: parseInt(id) },
            data: { status: "INACTIVE" },
        });

        return NextResponse.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Error deleting product:", error);
        return NextResponse.json(
            { error: "Failed to delete product" },
            { status: 500 }
        );
    }
}
