const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const productCode = '1010010001';
    const whCode = '42G1';
    const startDate = new Date('2025-01-01');

    console.log(`Checking transactions for product: ${productCode} in warehouse: ${whCode} before ${startDate.toISOString()}`);

    const items = await prisma.transactionDetail.findMany({
        where: {
            productCode,
            header: {
                docDate: { lt: startDate }
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

    console.log('DOC_NO | DATE | TYPE | WH | TO_WH | QTY | STATUS | MOVE_TYPE');
    console.log('------------------------------------------------------------------');

    let balance = 0;
    items.forEach(i => {
        const qty = Number(i.pieceQty);
        const docDate = i.header.docDate.toISOString().split('T')[0];
        const type = i.header.docTypeCode;
        const wh = i.header.whCode;
        const toWh = i.header.toWhCode;
        const status = i.header.docStatus;
        const moveType = i.header.documentType?.movementType || 'N/A';

        let delta = 0;
        if (status === 'APPROVED') {
            if (type === 'TRN') {
                if (wh === whCode) delta -= qty;
                if (toWh === whCode) delta += qty;
            } else {
                if (toWh === whCode) {
                    delta += qty;
                } else if (wh === whCode) {
                    delta += (moveType === 'IN' ? qty : -qty);
                }
            }
            balance += delta;
        }

        console.log(`${i.docNo.padEnd(10)} | ${docDate} | ${type.padEnd(4)} | ${wh?.padEnd(4)} | ${toWh?.padEnd(5)} | ${qty.toString().padStart(6)} | ${status.padEnd(8)} | ${moveType.padEnd(4)} | Delta: ${delta.toString().padStart(6)} | Run: ${balance.toString().padStart(6)}`);
    });

    console.log('------------------------------------------------------------------');
    console.log(`Final Calculated Opening Balance: ${balance} pieces (${balance / 72} cartons)`);
}

check().finally(() => prisma.$disconnect());
