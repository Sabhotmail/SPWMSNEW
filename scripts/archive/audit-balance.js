const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const productCode = '1010010001';
const whCode = '42G1';
const date = new Date('2025-01-01');

async function audit() {
    console.log(`--- Corrected Audit Transaction for ${productCode} in ${whCode} (Before 2025) ---`);

    const movements = await prisma.transactionDetail.findMany({
        where: {
            productCode,
            whCode, // กรองระดับ Detail เพื่อกันการนับซ้ำจาก Header OR logic
            header: {
                docStatus: 'APPROVED',
                docDate: { lt: date }
            }
        },
        include: {
            header: {
                include: { documentType: true }
            }
        },
        orderBy: {
            header: { docDate: 'asc' }
        }
    });

    let balance = 0;
    console.log('Date | DocNo | Type | RecType | Qty | Running Balance');
    console.log('---------------------------------------------------------');

    movements.forEach(m => {
        const qty = Number(m.pieceQty);
        let change = 0;

        if (m.header.docTypeCode === "TRN") {
            // ถ้ารายการมาจากคลังต้นทาง (recordType 1) = จ่ายออก
            // ถ้ารายการมาคลังปลายทาง (recordType 2) = รับเข้า
            if (m.recordType === '1') change = -qty;
            else if (m.recordType === '2') change = qty;
        } else {
            const isIncoming = m.header.documentType.movementType === "IN";
            change = isIncoming ? qty : -qty;
        }

        balance += change;
        console.log(`${m.header.docDate.toISOString().split('T')[0]} | ${m.docNo} | ${m.header.docTypeCode} | ${m.recordType} | ${change} | ${balance}`);
    });

    console.log('---------------------------------------------------------');
    console.log("Final Audit Balance:", balance, "pieces (", balance / 72, "cartons )");
}

audit().finally(() => prisma.$disconnect());
