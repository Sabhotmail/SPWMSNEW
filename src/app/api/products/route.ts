import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { serializeForJSON } from "@/lib/serialize";

// GET - List all products
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get("search") || "";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        const where = search
            ? {
                OR: [
                    { productCode: { contains: search, mode: "insensitive" as const } },
                    { productName: { contains: search, mode: "insensitive" as const } },
                ],
                status: "ACTIVE",
            }
            : { status: "ACTIVE" };

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: {
                    principal: true,
                    brand: true,
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.product.count({ where }),
        ]);

        return NextResponse.json(serializeForJSON({
            data: products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }));
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json(
            { error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}

// POST - Create new product
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            productCode, productName, principalProductCode,
            pieceBarcode, packBarcode, innerBarcode, caseBarcode,
            shelfLife, reorderPoint, stockControl,
            caseWeight, caseWidth, caseLength, caseHeight, caseVolume,
            principalCode, brandCode, baseUomCode
        } = body;

        // Check if product code already exists
        const existing = await prisma.product.findUnique({
            where: { productCode: productCode.toUpperCase() },
        });

        if (existing) {
            return NextResponse.json(
                { error: "รหัสสินค้านี้มีอยู่แล้ว" },
                { status: 409 }
            );
        }

        const product = await prisma.product.create({
            data: {
                productCode: productCode.toUpperCase(),
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
                status: "ACTIVE",
            },
            include: {
                principal: true,
                brand: true,
            },
        });

        return NextResponse.json(serializeForJSON(product), { status: 201 });
    } catch (error) {
        console.error("Error creating product:", error);
        return NextResponse.json(
            { error: "Failed to create product" },
            { status: 500 }
        );
    }
}
