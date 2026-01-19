const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const docNo = 'IN2026000001';
    console.log(`Checking transaction: ${docNo}`);

    const tx = await prisma.transactionHeader.findUnique({
        where: { docNo },
        include: {
            documentType: true,
            details: {
                include: { product: true }
            }
        }
    });

    if (!tx) {
        console.log('Transaction not found');
        return;
    }

    console.log('--- Transaction Header ---');
    console.log(`DocTypeCode: ${tx.docTypeCode}`);
    console.log(`DocStatus: ${tx.docStatus}`);
    console.log(`MovementType (from DocumentType): ${tx.documentType?.movementType}`);

    console.log('\n--- Transaction Details ---');
    for (const d of tx.details) {
        console.log(`- Product: ${d.productCode}, Qty: ${d.qty}, PieceQty: ${d.pieceQty}, Loc: ${d.locCode}`);

        const stock = await prisma.stock.findUnique({
            where: {
                productCode_whCode_locCode: {
                    productCode: d.productCode,
                    whCode: tx.whCode,
                    locCode: d.locCode || ''
                }
            }
        });
        console.log(`  Current Stock: ${stock ? stock.qty : 0} (Balance: ${stock ? stock.balance : 0})`);

        const stockDate = await prisma.stockDate.findMany({
            where: {
                productCode: d.productCode,
                whCode: tx.whCode,
                locCode: d.locCode || '',
                mfgDate: d.mfgDate,
                expDate: d.expDate
            }
        });
        console.log(`  StockDate entries found: ${stockDate.length}`);
        if (stockDate.length > 0) {
            console.log(`  StockDate Qty: ${stockDate[0].qty}`);
        }
    }

    console.log('\n--- Stock Logs for this Doc ---');
    const logs = await prisma.stockLog.findMany({
        where: { docNo }
    });
    console.log(`Found ${logs.length} logs`);
    logs.forEach(l => {
        console.log(`- ${l.productCode}: ${l.balanceOld} -> ${l.balanceNew} (Changed: ${l.pieceQty})`);
    });
}

check()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
