import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function debugOpeningBalance() {
    const productCode = '1010010001';
    const whCode = '42G1';
    const startDate = new Date('2025-01-01');

    console.log(`🔎 ตรวจสอบรายการของสินค้า ${productCode} ในคลัง ${whCode} ก่อนวันที่ 2025-01-01...`);

    const movements = await prisma.transactionDetail.findMany({
        where: {
            productCode,
            header: {
                docStatus: "APPROVED",
                docDate: { lt: startDate },
            }
        },
        include: {
            header: {
                include: { documentType: true }
            }
        },
        orderBy: { header: { docDate: 'asc' } }
    });

    console.log(`📊 พบทั้งหมด ${movements.length} รายการ:`);
    let balance = 0;

    for (const m of movements) {
        const qty = Number(m.pieceQty);
        let direction = 0;
        let type = '';

        if (m.header.docTypeCode === "TRN") {
            if (m.header.whCode === whCode) direction = -1;
            if (m.header.toWhCode === whCode) direction = 1;
            type = 'TRN';
        } else {
            direction = m.header.documentType.movementType === "IN" ? 1 : -1;
            type = m.header.documentType.movementType;
        }

        const delta = qty * direction;
        balance += delta;

        console.log(`- [${m.header.docDate.toISOString().split('T')[0]}] ${m.docNo} (${m.header.docTypeCode}/${type}): ${delta} ชิ้น (Qty: ${qty}) -> Balance: ${balance}`);
    }

    console.log(`\n✅ ผลรวมในหน่วยชิ้น: ${balance}`);
    console.log(`📦 ผลรวมในหน่วยลัง (หาร 72): ${balance / 72}`);
}

debugOpeningBalance()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
