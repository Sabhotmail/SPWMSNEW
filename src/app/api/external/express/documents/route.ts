import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Express API Configuration (will be replaced with real endpoints)
const EXPRESS_API_BASE = process.env.EXPRESS_API_URL || "";
const EXPRESS_API_USERNAME = process.env.EXPRESS_API_USERNAME || "";
const EXPRESS_API_PASSWORD = process.env.EXPRESS_API_PASSWORD || "";

// Mock data for testing before Express API is ready
const MOCK_DOCUMENTS: Record<string, {
    documentNo: string;
    documentType: string;
    items: Array<{
        productCode: string;
        productName: string;
        qty: number;
        uomCode: string;
    }>;
}> = {
    "PO20240001": {
        documentNo: "PO20240001",
        documentType: "PO",
        items: [
            { productCode: "1010010001", productName: "สินค้าทดสอบ A", qty: 10, uomCode: "CTN" },
            { productCode: "1010010002", productName: "สินค้าทดสอบ B", qty: 5, uomCode: "PCS" },
            { productCode: "1010010003", productName: "สินค้าทดสอบ C", qty: 20, uomCode: "CTN" },
        ],
    },
    "PO20240002": {
        documentNo: "PO20240002",
        documentType: "PO",
        items: [
            { productCode: "1010010001", productName: "สินค้าทดสอบ A", qty: 50, uomCode: "CTN" },
        ],
    },
};

/**
 * Authenticate with Express API and get token
 */
async function getExpressToken(): Promise<string | null> {
    if (!EXPRESS_API_BASE) {
        console.log("[Express API] Using mock mode - no API URL configured");
        return null;
    }

    try {
        const response = await fetch(`${EXPRESS_API_BASE}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: EXPRESS_API_USERNAME,
                password: EXPRESS_API_PASSWORD,
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to authenticate with Express API");
        }

        const data = await response.json();
        return data.token;
    } catch (error) {
        console.error("[Express API] Authentication error:", error);
        return null;
    }
}

/**
 * Fetch document from Express API
 */
async function fetchExpressDocument(documentNo: string, token: string) {
    const response = await fetch(`${EXPRESS_API_BASE}/documents/${documentNo}`, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`Document not found: ${documentNo}`);
    }

    return response.json();
}

/**
 * POST /api/external/express/documents
 * Fetch document data from Express system
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { documentNo } = body;

        if (!documentNo) {
            return NextResponse.json(
                { error: "กรุณาระบุเลขที่เอกสาร" },
                { status: 400 }
            );
        }

        // Check if we're in mock mode
        if (!EXPRESS_API_BASE) {
            // Use mock data
            const mockDoc = MOCK_DOCUMENTS[documentNo.toUpperCase()];
            if (!mockDoc) {
                return NextResponse.json(
                    { error: `ไม่พบเอกสาร ${documentNo} ในระบบ Express (Mock Mode)` },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                source: "mock",
                document: mockDoc,
            });
        }

        // Real Express API flow
        const token = await getExpressToken();
        if (!token) {
            return NextResponse.json(
                { error: "ไม่สามารถเชื่อมต่อกับระบบ Express ได้" },
                { status: 503 }
            );
        }

        const document = await fetchExpressDocument(documentNo, token);

        return NextResponse.json({
            success: true,
            source: "express",
            document,
        });

    } catch (error) {
        console.error("[Express API] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" },
            { status: 500 }
        );
    }
}
