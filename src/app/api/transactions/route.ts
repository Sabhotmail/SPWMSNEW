import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { serializeForJSON } from "@/lib/serialize";
import { updateFutureStock, checkStockAvailability } from "@/lib/future-stock";

// GET - List transactions
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const docType = searchParams.get("docType");
        const status = searchParams.get("status");

        const where: Record<string, unknown> = {};
        if (docType) where.docTypeCode = docType;
        if (status) where.docStatus = status;

        const transactions = await prisma.transactionHeader.findMany({
            where,
            include: {
                documentType: true,
                createdByUser: {
                    select: { username: true, userId: true },
                },
                _count: { select: { details: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        });

        return NextResponse.json(serializeForJSON(transactions));
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return NextResponse.json(
            { error: "Failed to fetch transactions" },
            { status: 500 }
        );
    }
}

// POST - Create new transaction
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { docTypeCode, whCode, toWhCode, ref1, ref2, ref3, movementTypeCode, salesmanCode, remark, items } = body;

        // Get document type to determine movement direction
        const documentType = await prisma.documentType.findUnique({
            where: { docTypeCode }
        });

        if (!documentType) {
            return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
        }

        // Resolve outbound from document type, or ADJ movement type direction
        let isOutbound = documentType.movementType === "OUT" || docTypeCode === "TRN" || docTypeCode === "TF";
        if (docTypeCode === "ADJ" && movementTypeCode) {
            const mt = await prisma.movementType.findUnique({
                where: { movementTypeCode },
            });
            if (mt) isOutbound = mt.direction === "OUT";
        }

        // For outbound transactions, validate stock availability BEFORE creating
        if (isOutbound && items && items.length > 0) {
            for (const item of items) {
                const pieceQty = item.pieceQty || Number(item.qty);
                const locCode = item.locCode || "";

                const stockCheck = await checkStockAvailability(
                    item.productCode,
                    whCode,
                    pieceQty,
                    locCode
                );

                if (!stockCheck.available) {
                    return NextResponse.json(
                        { error: `สินค้า ${item.productCode}: ${stockCheck.message}` },
                        { status: 400 }
                    );
                }
            }
        }

        // Ensure user exists in database (upsert if necessary)
        const userId = session.user.userId;
        let existingUser = await prisma.user.findUnique({
            where: { userId },
        });

        if (!existingUser) {
            // Create user if not exists
            existingUser = await prisma.user.create({
                data: {
                    userId,
                    username: session.user.name || userId,
                    password: "", // Will be updated on first login
                    status: "ACTIVE",
                    role: 3, // Default user role
                    branchCode: "HQ", // Default branch
                },
            });
        }

        // Legacy format: [Type]S[yy][6-digit] e.g. INS26000001 — allocate atomically
        const fullYear = new Date().getFullYear();
        const shortYear = String(fullYear).slice(-2);
        const prefix = `${docTypeCode}S${shortYear}`;

        const transaction = await prisma.$transaction(async (txPrisma) => {
            await txPrisma.$executeRaw`
                INSERT INTO document_numbers (doc_type_code, year, last_number, created_at, updated_at)
                VALUES (${docTypeCode}, ${fullYear}, 0, NOW(), NOW())
                ON CONFLICT (doc_type_code, year) DO NOTHING
            `;

            const locked = await txPrisma.$queryRaw<Array<{ id: number; last_number: number }>>`
                SELECT id, last_number FROM document_numbers
                WHERE doc_type_code = ${docTypeCode} AND year = ${fullYear}
                FOR UPDATE
            `;
            if (!locked.length) {
                throw new Error("Failed to lock document number counter");
            }

            const maxRow = await txPrisma.$queryRaw<Array<{ max_no: string | null }>>`
                SELECT MAX(doc_no) AS max_no FROM transaction_headers
                WHERE doc_no LIKE ${prefix + "%"}
            `;
            let maxExisting = 0;
            const maxNo = maxRow[0]?.max_no;
            if (maxNo && maxNo.startsWith(prefix)) {
                maxExisting = Number(maxNo.slice(prefix.length)) || 0;
            }

            const nextNumber = Math.max(locked[0].last_number, maxExisting) + 1;
            const docNo = `${prefix}${String(nextNumber).padStart(6, "0")}`;

            await txPrisma.documentNumber.update({
                where: { id: locked[0].id },
                data: { lastNumber: nextNumber },
            });

            // Create the transaction
            const tx = await txPrisma.transactionHeader.create({
                data: {
                    docNo,
                    docTypeCode,
                    docDate: new Date(),
                    postDate: new Date(),
                    whCode,
                    toWhCode,
                    ref1,
                    ref2,
                    ref3,
                    movementTypeCode,
                    salesmanCode,
                    remark,
                    docStatus: "DRAFT",
                    docState: "OPEN",
                    createdBy: session.user.userId,
                    createdUserName: session.user.name,
                    details: items && items.length > 0 ? {
                        create: items.map((item: {
                            productCode: string;
                            uomCode: string;
                            qty: number;
                            uomRatio?: number;
                            pieceQty?: number;
                            mfgDate?: string;
                            expDate?: string;
                            lotNo?: string;
                            remark?: string;
                            locCode?: string
                        }, index: number) => ({
                            lineNo: index + 1,
                            productCode: item.productCode,
                            uomCode: item.uomCode,
                            uomQty: Number(item.qty),
                            uomRatio: item.uomRatio || 1,
                            pieceQty: item.pieceQty || Number(item.qty),
                            qty: item.pieceQty || Number(item.qty),
                            whCode: whCode,
                            locCode: item.locCode || "",
                            mfgDate: item.mfgDate ? new Date(item.mfgDate) : null,
                            expDate: item.expDate ? new Date(item.expDate) : null,
                            lotNo: item.lotNo,
                            remark: item.remark,
                        })),
                    } : undefined,
                },
                include: {
                    documentType: true,
                    details: { include: { product: true } },
                },
            });

            return tx;
        });

        // Update Future Stock for each item (outside the transaction for better error handling)
        if (items && items.length > 0) {
            const direction: "IN" | "OUT" = isOutbound ? "OUT" : "IN";
            const createdDocNo = transaction.docNo;

            for (const item of items) {
                const pieceQty = item.pieceQty || Number(item.qty);

                await updateFutureStock({
                    productCode: item.productCode,
                    whCode: whCode,
                    locCode: item.locCode || "",
                    pieceQty: pieceQty,
                    direction: direction,
                    mfgDate: item.mfgDate ? new Date(item.mfgDate) : null,
                    expDate: item.expDate ? new Date(item.expDate) : null,
                    docNo: createdDocNo,
                    userId: session.user.userId,
                });
            }

            // For Transfer, also update destination warehouse future stock
            if ((docTypeCode === "TRN" || docTypeCode === "TF") && toWhCode) {
                for (const item of items) {
                    const pieceQty = item.pieceQty || Number(item.qty);

                    await updateFutureStock({
                        productCode: item.productCode,
                        whCode: toWhCode,
                        locCode: item.locCode || "",
                        pieceQty: pieceQty,
                        direction: "IN",
                        mfgDate: item.mfgDate ? new Date(item.mfgDate) : null,
                        expDate: item.expDate ? new Date(item.expDate) : null,
                        docNo: createdDocNo,
                        userId: session.user.userId,
                    });
                }
            }
        }

        return NextResponse.json(serializeForJSON(transaction), { status: 201 });
    } catch (error) {
        console.error("Error creating transaction:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create transaction" },
            { status: 500 }
        );
    }
}
