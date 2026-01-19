const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDatabase() {
    console.log('🧹 กำลังล้างข้อมูลทั้งหมดในระบบใหม่...\n');

    try {
        // ใช้ Raw SQL เพื่อ TRUNCATE ทุกตาราง (เร็วกว่า deleteMany)
        // TRUNCATE จะ reset auto-increment ด้วย

        console.log('🗑️ กำลังลบข้อมูลตามลำดับ Foreign Key...');

        // 1. ลบ Log tables ก่อน
        console.log('   - stock_logs...');
        await prisma.$executeRaw`TRUNCATE TABLE stock_logs RESTART IDENTITY CASCADE`;

        console.log('   - activity_logs...');
        await prisma.$executeRaw`TRUNCATE TABLE activity_logs RESTART IDENTITY CASCADE`;

        // 2. ลบ Transaction tables
        console.log('   - transaction_details...');
        await prisma.$executeRaw`TRUNCATE TABLE transaction_details RESTART IDENTITY CASCADE`;

        console.log('   - transaction_headers...');
        await prisma.$executeRaw`TRUNCATE TABLE transaction_headers RESTART IDENTITY CASCADE`;

        // 3. ลบ Stock tables
        console.log('   - stock_dates...');
        await prisma.$executeRaw`TRUNCATE TABLE stock_dates RESTART IDENTITY CASCADE`;

        console.log('   - stocks...');
        await prisma.$executeRaw`TRUNCATE TABLE stocks RESTART IDENTITY CASCADE`;

        // 4. ลบ Document tables
        console.log('   - document_numbers...');
        await prisma.$executeRaw`TRUNCATE TABLE document_numbers RESTART IDENTITY CASCADE`;

        // 5. ลบ Product tables
        console.log('   - product_uoms...');
        await prisma.$executeRaw`TRUNCATE TABLE product_uoms RESTART IDENTITY CASCADE`;

        console.log('   - products...');
        await prisma.$executeRaw`TRUNCATE TABLE products RESTART IDENTITY CASCADE`;

        // 6. ลบ Location tables
        console.log('   - locations...');
        await prisma.$executeRaw`TRUNCATE TABLE locations RESTART IDENTITY CASCADE`;

        console.log('   - warehouses...');
        await prisma.$executeRaw`TRUNCATE TABLE warehouses RESTART IDENTITY CASCADE`;

        // 7. ลบ Master tables
        console.log('   - uoms...');
        await prisma.$executeRaw`TRUNCATE TABLE uoms RESTART IDENTITY CASCADE`;

        console.log('   - brands...');
        await prisma.$executeRaw`TRUNCATE TABLE brands RESTART IDENTITY CASCADE`;

        console.log('   - principals...');
        await prisma.$executeRaw`TRUNCATE TABLE principals RESTART IDENTITY CASCADE`;

        console.log('   - document_types...');
        await prisma.$executeRaw`TRUNCATE TABLE document_types RESTART IDENTITY CASCADE`;

        console.log('   - movement_types...');
        await prisma.$executeRaw`TRUNCATE TABLE movement_types RESTART IDENTITY CASCADE`;

        // 8. ลบ User tables
        console.log('   - users...');
        await prisma.$executeRaw`TRUNCATE TABLE users RESTART IDENTITY CASCADE`;

        console.log('   - branches...');
        await prisma.$executeRaw`TRUNCATE TABLE branches RESTART IDENTITY CASCADE`;

        // 9. ลบ Temp tables
        console.log('   - baskets...');
        await prisma.$executeRaw`TRUNCATE TABLE baskets RESTART IDENTITY CASCADE`;

        console.log('\n✅ ล้างข้อมูลเรียบร้อยแล้ว!');

        // แสดงสถานะหลังล้าง
        console.log('\n📊 ตรวจสอบจำนวนข้อมูลหลังล้าง:');

        const counts = await Promise.all([
            prisma.user.count(),
            prisma.product.count(),
            prisma.warehouse.count(),
            prisma.transactionHeader.count(),
            prisma.stock.count(),
        ]);

        console.log(`   - Users: ${counts[0]}`);
        console.log(`   - Products: ${counts[1]}`);
        console.log(`   - Warehouses: ${counts[2]}`);
        console.log(`   - Transactions: ${counts[3]}`);
        console.log(`   - Stocks: ${counts[4]}`);

        if (counts.every(c => c === 0)) {
            console.log('\n🎉 ฐานข้อมูลว่างเปล่าพร้อมใช้งาน!');
        }

    } catch (err) {
        console.error('❌ เกิดข้อผิดพลาด:', err.message);
        if (err.meta) console.error('Meta:', err.meta);
    } finally {
        await prisma.$disconnect();
    }
}

cleanDatabase();
