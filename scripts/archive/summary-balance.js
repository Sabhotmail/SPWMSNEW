const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const productCode = '1010010001';
const whCode = '42G1';
const date = new Date('2025-01-01');

async function summarize() {
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
        },
        orderBy: {
            header: { docDate: 'asc' }
        }
    });

    console.log(`--- Stock Summary for ${productCode} in ${whCode} ---`);
    console.log(`Total Transactions: ${movements.length}`);

    // Group by DocType
    const typeSummary = {};
    // Group by Month
    const monthlySummary = {};

    let balance = 0;

    movements.forEach(m => {
        const qty = Number(m.pieceQty);
        let change = 0;
        const type = m.header.docTypeCode;
        const month = m.header.docDate.toISOString().substring(0, 7); // YYYY-MM

        if (type === "TRN") {
            if (m.recordType === '1') change = -qty;
            else if (m.recordType === '2') change = qty;
        } else {
            const isIncoming = m.header.documentType.movementType === "IN";
            change = isIncoming ? qty : -qty;
        }

        balance += change;

        // Sum by type
        if (!typeSummary[type]) typeSummary[type] = 0;
        typeSummary[type] += change;

        // Final balance by month
        monthlySummary[month] = balance;
    });

    console.log('\n[1] Summary by Document Type (Net Change):');
    Object.keys(typeSummary).forEach(type => {
        console.log(`${type}: ${typeSummary[type] / 72} cartons (${typeSummary[type]} pieces)`);
    });

    console.log('\n[2] Running Balance by Month:');
    Object.keys(monthlySummary).forEach(month => {
        console.log(`${month}: ${monthlySummary[month] / 72} cartons`);
    });

    console.log('\n---------------------------------------------------------');
    console.log("FINAL TOTAL:", balance / 72, "cartons");
}

summarize().finally(() => prisma.$disconnect());
