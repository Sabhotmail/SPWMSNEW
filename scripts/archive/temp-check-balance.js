const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const productCode = '1010010001';
const whCode = '42G1';
const date = new Date('2025-01-01');

async function check() {
    const movements = await prisma.transactionDetail.findMany({
        where: {
            productCode,
            whCode,
            header: {
                docStatus: 'APPROVED',
                docDate: { lt: date }
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
        const qty = Number(m.pieceQty);
        if (m.header.docTypeCode === "TRN") {
            if (m.recordType === '1') balance -= qty;
            else if (m.recordType === '2') balance += qty;
        } else {
            const isIncoming = m.header.documentType.movementType === "IN";
            balance += isIncoming ? qty : -qty;
        }
        // console.log(m.docNo, m.recordType, isIncoming ? 'IN' : 'OUT', qty, balance);
    });
    console.log("Balance:", balance, "Cartons:", balance / 72);
}
check().finally(() => prisma.$disconnect());
