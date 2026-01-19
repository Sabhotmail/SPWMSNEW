const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTransactionLogs() {
    const DOC_NO = 'IN2026000006';
    console.log(`🔍 ตรวจสอบข้อมูลสำหรับเอกสาร: ${DOC_NO}`);

    try {
        // 1. ดังข้อมูล Transaction Header
        const header = await prisma.transactionHeader.findUnique({
            where: { docNo: DOC_NO },
            include: { details: true }
        });
        console.log('\n--- Header Info ---');
        console.log(`Status: ${header?.docStatus}`);
        console.log(`Approved At: ${header?.approvedAt}`);
        console.log(`Details Count: ${header?.details.length}`);

        // 2. ดึงรายละเอียดสินค้าในบิล
        console.log('\n--- Detail Items ---');
        header?.details.forEach((d, i) => {
            console.log(`${i + 1}. Product: ${d.productCode}, Qty: ${d.pieceQty}, WH: ${d.whCode}`);
        });

        // 3. ตรวจสอบ Stock Logs
        const logs = await prisma.stockLog.findMany({
            where: { docNo: DOC_NO },
            orderBy: { createdAt: 'asc' }
        });
        console.log('\n--- Stock Logs ---');
        console.table(logs.map(l => ({
            Time: l.createdAt.toISOString(),
            Product: l.productCode,
            Change: l.pieceQty,
            Old: l.balanceOld,
            New: l.balanceNew,
            Func: l.functionName
        })));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

checkTransactionLogs();
