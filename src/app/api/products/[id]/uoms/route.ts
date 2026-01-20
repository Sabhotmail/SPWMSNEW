import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeForJSON } from "@/lib/serialize";

export const dynamic = "force-dynamic";

// GET - Get UOMs for a specific product by productCode
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // id can be either numeric id or productCode
        let productCode = id;

        // If id is numeric, find the product first
        if (/^\d+$/.test(id)) {
            const product = await prisma.product.findUnique({
                where: { id: parseInt(id) },
                select: { productCode: true },
            });
            if (product) {
                productCode = product.productCode;
            }
        }

        // Get product with base UOM and shelfLife
        const product = await prisma.product.findUnique({
            where: { productCode },
            select: {
                productCode: true,
                productName: true,
                baseUomCode: true,
                shelfLife: true,
            },
        });

        if (!product) {
            return NextResponse.json(
                { error: "ไม่พบสินค้า" },
                { status: 404 }
            );
        }

        // Get all UOMs for this product
        const productUOMs = await prisma.productUOM.findMany({
            where: {
                productCode: product.productCode,
                status: "ACTIVE",
            },
            include: {
                uom: true,
            },
            orderBy: { uomRatio: "desc" }, // Largest unit first (CTN > PCS)
        });

        // If no product UOMs defined, return base UOM with ratio 1
        if (productUOMs.length === 0 && product.baseUomCode) {
            const baseUOM = await prisma.uOM.findUnique({
                where: { uomCode: product.baseUomCode },
            });

            if (baseUOM) {
                return NextResponse.json({
                    productCode: product.productCode,
                    productName: product.productName,
                    baseUomCode: product.baseUomCode,
                    uoms: [
                        {
                            uomCode: baseUOM.uomCode,
                            uomName: baseUOM.uomName,
                            uomRatio: 1,
                            isBase: true,
                        },
                    ],
                });
            }
        }

        // Map to response format
        const uoms = productUOMs.map((pu) => ({
            uomCode: pu.uomCode,
            uomName: pu.uom.uomName,
            uomRatio: pu.uomRatio,
            conversionRate: Number(pu.conversionRate),
            isBase: pu.uomCode === product.baseUomCode,
        }));

        // If base UOM not in list, add it
        if (product.baseUomCode && !uoms.find((u) => u.uomCode === product.baseUomCode)) {
            const baseUOM = await prisma.uOM.findUnique({
                where: { uomCode: product.baseUomCode },
            });

            if (baseUOM) {
                uoms.push({
                    uomCode: baseUOM.uomCode,
                    uomName: baseUOM.uomName,
                    uomRatio: 1,
                    conversionRate: 1,
                    isBase: true,
                });
            }
        }

        // Sort by ratio descending
        uoms.sort((a, b) => b.uomRatio - a.uomRatio);

        return NextResponse.json({
            productCode: product.productCode,
            productName: product.productName,
            baseUomCode: product.baseUomCode,
            shelfLife: product.shelfLife || 0,
            uoms,
        });
    } catch (error) {
        console.error("Error fetching product UOMs:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการดึงข้อมูลหน่วยนับ" },
            { status: 500 }
        );
    }
}

// POST - Add new UOM for product
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { uomCode, uomRatio, conversionRate } = body;

        // Validate
        if (!uomCode || !uomRatio) {
            return NextResponse.json(
                { error: "กรุณาระบุหน่วยนับและอัตราส่วน" },
                { status: 400 }
            );
        }

        // Get productCode from id
        let productCode = id;
        if (/^\d+$/.test(id)) {
            const product = await prisma.product.findUnique({
                where: { id: parseInt(id) },
                select: { productCode: true },
            });
            if (product) {
                productCode = product.productCode;
            }
        }

        // Check if product exists
        const product = await prisma.product.findUnique({
            where: { productCode },
        });

        if (!product) {
            return NextResponse.json(
                { error: "ไม่พบสินค้า" },
                { status: 404 }
            );
        }

        // Check if UOM exists
        const uom = await prisma.uOM.findUnique({
            where: { uomCode },
        });

        if (!uom) {
            return NextResponse.json(
                { error: "ไม่พบหน่วยนับ" },
                { status: 404 }
            );
        }

        // Create or update ProductUOM
        const productUOM = await prisma.productUOM.upsert({
            where: {
                productCode_uomCode: { productCode, uomCode },
            },
            update: {
                uomRatio: Number(uomRatio),
                conversionRate: conversionRate ? Number(conversionRate) : 1,
                status: "ACTIVE",
            },
            create: {
                productCode,
                uomCode,
                uomRatio: Number(uomRatio),
                conversionRate: conversionRate ? Number(conversionRate) : 1,
                status: "ACTIVE",
            },
            include: {
                uom: true,
            },
        });

        return NextResponse.json(serializeForJSON(productUOM), { status: 201 });
    } catch (error) {
        console.error("Error creating product UOM:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการสร้างหน่วยนับ" },
            { status: 500 }
        );
    }
}
