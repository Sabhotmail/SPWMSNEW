const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMissingOpeningBalance() {
    const productCode = '1010010001';
    const whCode = '42G1';
    const docNo = 'BEG-MANUAL-001';
    const qty = 4320; // 60 cartons * 72

    console.log(`🚀 กำลังตรวจสอบและสร้างใบรับยอดตั้งต้น (60 ลัง) สำหรับ ${productCode} ในคลัง ${whCode}...`);

    try {
        // 1. ตรวจสอบว่ามี DocumentType 'BEG' หรือไม่ ถ้าไม่มีให้สร้างก่อน
        await prisma.documentType.upsert({
            where: { docTypeCode: 'BEG' },
            update: {},
            create: {
                docTypeCode: 'BEG',
                docTypeName: 'Beginning Balance',
                movementType: 'IN'
            }
        });

        // 2. ตรวจสอบว่ามีเลขที่ซ้ำไหม
        const existing = await prisma.transactionHeader.findUnique({ where: { docNo } });
        if (existing) {
            console.log('⚠️ ใบงานนี้มีอยู่แล้ว ข้ามการสร้าง...');
        } else {
            // 3. หา User มาคนหนึ่งสำหรับอ้างอิง
            const user = await prisma.user.findFirst();
            if (!user) {
                console.error('❌ ไม่พบข้อมูล User ในระบบ');
                return;
            }

            // 4. ใช้ Raw SQL เพื่อ insert ข้อมูลโดยตรง (หลีกเลี่ยง Prisma client compatibility issues)
            const docDate = '2023-12-31';

            // Insert TransactionHeader
            await prisma.$executeRaw`
                INSERT INTO transaction_headers (
                    doc_no, doc_type_code, doc_date, post_date,
                    wh_code, to_wh_code, doc_status, doc_state,
                    created_by, approved_by, approved_at, created_at, updated_at
                ) VALUES (
                    ${docNo}, 'BEG', ${new Date(docDate)}, ${new Date(docDate)},
                    ${whCode}, ${whCode}, 'APPROVED', 'CLOSED',
                    ${user.userId}, ${user.userId}, ${new Date(docDate)}, NOW(), NOW()
                )
            `;

            // Insert TransactionDetail
            await prisma.$executeRaw`
                INSERT INTO transaction_details (
                    doc_no, line_no, product_code, uom_code,
                    uom_qty, uom_ratio, piece_qty, qty,
                    wh_code, loc_code, mfg_date, doc_state, record_type,
                    status, created_at, updated_at
                ) VALUES (
                    ${docNo}, 1, ${productCode}, 'PCS',
                    60, 72, ${qty}, ${qty},
                    ${whCode}, '', ${new Date(docDate)}, 'CLOSED', '0',
                    'ACTIVE', NOW(), NOW()
                )
            `;

            console.log('✅ สร้างใบรับยอดตั้งต้น 60 ลัง เรียบร้อยแล้ว!');
        }

        // 5. ตรวจสอบยอดรวมสรุปในระบบใหม่ (ยอดก่อน 2025)
        const movements = await prisma.transactionDetail.findMany({
            where: {
                productCode,
                header: {
                    docStatus: "APPROVED",
                    docDate: { lt: new Date('2025-01-01') },
                    OR: [
                        { whCode: whCode },
                        { toWhCode: whCode }
                    ]
                }
            },
            include: {
                header: {
                    include: { documentType: true }
                }
            }
        });

        let balance = 0;
        movements.forEach(m => {
            const mQty = Number(m.pieceQty);
            if (m.header.docTypeCode === "TRN") {
                if (m.header.whCode === whCode) balance -= mQty;
                if (m.header.toWhCode === whCode) balance += mQty;
            } else {
                const isIncoming = m.header.documentType.movementType === "IN";
                if (m.header.toWhCode === whCode) balance += mQty;
                else if (m.header.whCode === whCode) balance += isIncoming ? mQty : -mQty;
            }
        });

        console.log(`\n📊 ยอดOpening Balance ในระบบใหม่ (ณ 1 ม.ค. 2025): ${balance} ชิ้น`);
        console.log(`📦 คิดเป็นลัง: ${balance / 72} ลัง`);

    } catch (err) {
        console.error('❌ เกิดข้อผิดพลาด:', err.message);
        if (err.meta) console.error('Meta:', err.meta);
    }
}

addMissingOpeningBalance()
    .finally(() => prisma.$disconnect());
