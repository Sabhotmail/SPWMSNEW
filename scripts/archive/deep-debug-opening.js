const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deepDebug() {
    const productCode = '1010010001';
    const whCode = '42G1'; // คลังสินค้าดี (ตรวจสอบอีกทีว่าชื่อนี้รหัสอะไร)
    const startDate = new Date('2025-01-01');

    console.log(`🔎 เริ่มตรวจสอบ Opening Balance (lt 2025-01-01) สำหรับ ${productCode}...`);

    // 1. ตรรกะเดียวกับใน page.tsx เป๊ะๆ
    const movements = await prisma.transactionDetail.findMany({
        where: {
            productCode,
            header: {
                docStatus: "APPROVED",
                docDate: { lt: startDate },
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
        },
        orderBy: { header: { docDate: 'asc' } }
    });

    console.log(`📊 พบรายการที่ระบบ "มองเห็น" ก่อนปี 2025: ${movements.length} รายการ`);

    let balance = 0;
    movements.forEach(m => {
        const qty = Number(m.pieceQty);
        let delta = 0;
        if (m.header.docTypeCode === "TRN") {
            if (m.header.whCode === whCode) delta = -qty;
            if (m.header.toWhCode === whCode) delta = qty;
        } else {
            const isIncoming = m.header.documentType.movementType === "IN";
            if (m.header.toWhCode === whCode) delta = qty;
            else if (m.header.whCode === whCode) delta = isIncoming ? qty : -qty;
        }
        balance += delta;
        console.log(`- [${m.header.docDate.toISOString()}] ${m.docNo} (${m.header.docTypeCode}): ${delta / 72} ลัง -> Running: ${balance / 72}`);
    });

    console.log(`\n❌ ยอดที่คำนวณได้: ${balance / 72} ลัง`);

    // 2. ลองหาว่ามีรายการที่ "มองไม่เห็น" หรือไม่ (เช่น ลืม Approve หรือรหัสคลังผิด)
    const ghostMovements = await prisma.transactionDetail.findMany({
        where: {
            productCode,
            header: {
                docDate: { lt: startDate },
                NOT: {
                    AND: [
                        { docStatus: "APPROVED" },
                        { OR: [{ whCode }, { toWhCode: whCode }] }
                    ]
                }
            }
        },
        include: { header: true },
        take: 10
    });

    if (ghostMovements.length > 0) {
        console.log(`\n⚠️ พบรายการที่ถูก "มองข้าม" (ไม่ได้ Approve หรือคลังไม่ตรง):`);
        ghostMovements.forEach(m => {
            console.log(`- ${m.docNo} | Date: ${m.header.docDate.toISOString()} | Status: ${m.header.docStatus} | WH: ${m.header.whCode} -> ${m.header.toWhCode}`);
        });
    }
}

deepDebug()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
