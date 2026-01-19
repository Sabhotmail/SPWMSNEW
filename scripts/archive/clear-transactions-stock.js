const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearData() {
    try {
        console.log('🧹 เริ่มกระบวนการล้างข้อมูล Transaction และ Stock...');

        // 1. ลบ Stock Logs และ Activity Logs
        console.log('   - ล้าง Stock Logs...');
        await prisma.stockLog.deleteMany({});

        console.log('   - ล้าง Activity Logs...');
        await prisma.activityLog.deleteMany({});

        // 2. ลบ Transactions (ต้องลบ Detail ก่อน Header)
        console.log('   - ล้าง Transaction Details...');
        await prisma.transactionDetail.deleteMany({});

        console.log('   - ล้าง Transaction Headers...');
        await prisma.transactionHeader.deleteMany({});

        // 3. ลบ Stock Balances
        console.log('   - ล้าง Stock Date Balances...');
        await prisma.stockDate.deleteMany({});

        console.log('   - ล้าง Stock Balances...');
        await prisma.stock.deleteMany({});

        // 4. ล้าง Baskets
        console.log('   - ล้าง Baskets...');
        await prisma.basket.deleteMany({});

        // 5. รีเซ็ต Document Numbering
        console.log('   - ล้าง Document Numbers...');
        await prisma.documentNumber.deleteMany({});

        console.log('\n✅ ล้างข้อมูล Transaction และ Stock เรียบร้อยแล้ว!');
        console.log('   (หมายเหตุ: ข้อมูล Master Data เช่น สินค้า, คลังสินค้า, และผู้ใช้งาน ยังคงอยู่ครบถ้วน)');

    } catch (error) {
        console.error('\n❌ เกิดข้อผิดพลาดในการล้างข้อมูล:', error);
    } finally {
        await prisma.$disconnect();
    }
}

clearData();
