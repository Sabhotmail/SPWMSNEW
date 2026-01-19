const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const productCode = '1010010001';
    const whCode = '42G1';

    console.log('=== ตรวจสอบ BEG Transactions ===');

    // 1. ดู BEG transactions ที่สร้างขึ้น
    const begHeaders = await prisma.transactionHeader.findMany({
        where: { docTypeCode: 'BEG' },
        include: { details: true }
    });

    console.log('\nBEG Headers:', begHeaders.length);
    for (const h of begHeaders) {
        console.log('  DocNo:', h.docNo, '| WH:', h.whCode, '| Details:', h.details.length);

        // หา detail ของ product นี้
        const detail = h.details.find(d => d.productCode === productCode);
        if (detail) {
            console.log('    -> Product', productCode, ': pieceQty =', detail.pieceQty, '| cartons =', detail.pieceQty / 72);
        }
    }

    // 2. ดู stock balance จาก stocks table
    console.log('\n=== Stock Balance (จาก stocks table) ===');
    const stock = await prisma.stock.findFirst({
        where: { productCode, whCode }
    });
    if (stock) {
        console.log('Balance:', stock.balance, 'pieces =', stock.balance / 72, 'cartons');
    }

    // 3. คำนวณจาก transactions ทั้งหมด ก่อน 2025
    console.log('\n=== คำนวณจาก Transactions (ก่อน 1 ม.ค. 2025) ===');

    // ดึง MovementTypes เพื่อใช้ direction
    const movementTypes = await prisma.movementType.findMany();
    const mtMap = new Map(movementTypes.map(mt => [mt.movementTypeCode, mt.direction]));

    // ใช้ detail.whCode แทน header.whCode (เหมือนระบบเก่า)
    const movements = await prisma.transactionDetail.findMany({
        where: {
            productCode,
            whCode: whCode, // กรองจาก detail.whCode โดยตรง
            header: {
                docStatus: 'APPROVED',
                docDate: { lt: new Date('2025-01-01') }
            }
        },
        include: {
            header: { include: { documentType: true } }
        },
        orderBy: { header: { docDate: 'asc' } }
    });

    console.log('พบ', movements.length, 'รายการก่อน 2025');

    let balance = 0;
    let inTotal = 0;
    let outTotal = 0;

    for (const m of movements) {
        const mQty = Number(m.pieceQty);
        const docType = m.header.docTypeCode;
        // ใช้ movementTypeCode จาก detail เพื่อหา direction
        const movTypeCode = m.movementTypeCode || m.header.movementTypeCode;
        const direction = mtMap.get(movTypeCode) || m.header.documentType.movementType;

        // คำนวณเหมือนระบบเก่า: pieceQty * stocksign (direction)
        let change = 0;
        if (direction === 'IN') {
            change = mQty;
        } else {
            change = -mQty;
        }

        if (change > 0) inTotal += change;
        if (change < 0) outTotal += Math.abs(change);
        balance += change;

        console.log('  ', m.header.docDate.toISOString().split('T')[0], '|', m.header.docNo, '| Type:', docType, '| MoveType:', movTypeCode, '| Dir:', direction, '| pieceQty:', mQty, '| Change:', change > 0 ? '+' + change : change, '| Balance:', balance);
    }

    console.log('\n--- สรุป (ก่อน 2025) ---');
    console.log('รับเข้า:', inTotal, 'pieces =', inTotal / 72, 'cartons');
    console.log('จ่ายออก:', outTotal, 'pieces =', outTotal / 72, 'cartons');
    console.log('Opening Balance:', balance, 'pieces =', balance / 72, 'cartons');

    // 4. ดูว่าระบบเก่า 39 ลัง มาจากไหน
    console.log('\n=== เปรียบเทียบกับระบบเก่า ===');
    console.log('ระบบเก่า: 39 ลัง = 2808 pieces');
    console.log('ระบบใหม่:', balance / 72, 'ลัง =', balance, 'pieces');
    console.log('ผลต่าง:', (balance - 2808), 'pieces =', (balance - 2808) / 72, 'cartons');

    await prisma.$disconnect();
}

check();
