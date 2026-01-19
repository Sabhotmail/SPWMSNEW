const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const productCode = '1010010001';
const whCode = '42G1';
const date = new Date('2025-01-01');

async function verify() {
    console.log(`--- Verify Balance for ${productCode} in ${whCode} (After Fresh Migrate) ---\n`);

    // 1. ดึง MovementType mapping
    const movementTypes = await prisma.movementType.findMany();
    const mtMap = new Map();
    movementTypes.forEach(mt => mtMap.set(mt.movementTypeCode, mt.direction));
    console.log('[0] MovementType Mapping loaded:', mtMap.size, 'types');

    // 2. ดึง Transactions ก่อน 2025
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
            header: true
        }
    });

    console.log(`[1] Total Transactions (Before 2025, APPROVED): ${movements.length}`);

    // 3. คำนวณยอดตาม movementTypeCode และ direction
    let balance = 0;
    let inTotal = 0;
    let outTotal = 0;

    movements.forEach(m => {
        const qty = Number(m.pieceQty);
        const mtCode = m.movementTypeCode || m.header.movementTypeCode || '';
        const direction = mtMap.get(mtCode) || 'IN';

        if (direction === 'IN') {
            balance += qty;
            inTotal += qty;
        } else {
            balance -= qty;
            outTotal += qty;
        }
    });

    console.log(`\n[2] Calculation Result:`);
    console.log(`  Total IN:  ${inTotal} pieces (${inTotal / 72} cartons)`);
    console.log(`  Total OUT: ${outTotal} pieces (${outTotal / 72} cartons)`);
    console.log(`  NET Balance: ${balance} pieces (${balance / 72} cartons)`);

    // 4. เปรียบเทียบกับยอดใน stocks table
    const stock = await prisma.stock.findUnique({
        where: { productCode_whCode_locCode: { productCode, whCode, locCode: '' } }
    });
    console.log(`\n[3] Current Stock Balance in New System: ${stock?.balance || 0} pieces (${(stock?.balance || 0) / 72} cartons)`);

    // 5. ดู Transactions ทั้งหมด (รวม CANCELLED)
    const allMovements = await prisma.transactionDetail.findMany({
        where: {
            productCode,
            whCode,
            header: {
                docDate: { lt: date }
            }
        },
        include: { header: true }
    });

    console.log(`\n[4] All Transactions (including CANCELLED): ${allMovements.length}`);

    // นับแยกตาม docStatus
    const statusCount = {};
    allMovements.forEach(m => {
        const status = m.header.docStatus;
        statusCount[status] = (statusCount[status] || 0) + 1;
    });
    console.log('  By Status:', statusCount);
}

verify().finally(() => prisma.$disconnect());
