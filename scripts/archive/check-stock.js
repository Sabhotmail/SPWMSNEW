// ตรวจสอบ stock filtering
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log('=== all stocks (sample 10) ===');
    const all = await prisma.stock.findMany({
        take: 10,
        select: { productCode: true, whCode: true, qty: true }
    });
    console.table(all);

    console.log('\n=== filtered by 33D1 ===');
    const filtered = await prisma.stock.findMany({
        where: { whCode: '33D1' },
        take: 10,
        select: { productCode: true, whCode: true, qty: true }
    });
    console.table(filtered);

    await prisma.$disconnect();
}

check();
