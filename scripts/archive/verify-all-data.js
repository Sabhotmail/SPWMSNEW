// Verify all migrated data
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('========================================');
    console.log('   SPWMS DATA VERIFICATION SUMMARY');
    console.log('========================================\n');

    // Master Data
    console.log('📦 MASTER DATA');
    console.log('----------------------------------------');

    const principals = await prisma.principal.count();
    const brands = await prisma.brand.count();
    const warehouses = await prisma.warehouse.count();
    const locations = await prisma.location.count();
    const users = await prisma.user.count();
    const products = await prisma.product.count();
    const uoms = await prisma.uOM.count();
    const productUoms = await prisma.productUOM.count();
    const movementTypes = await prisma.movementType.count();
    const documentTypes = await prisma.documentType.count();

    console.log(`Principals (ผู้ผลิต):      ${principals}`);
    console.log(`Brands (แบรนด์):           ${brands}`);
    console.log(`Warehouses (คลัง):         ${warehouses}`);
    console.log(`Locations (ตำแหน่ง):       ${locations}`);
    console.log(`Users (ผู้ใช้):            ${users}`);
    console.log(`Products (สินค้า):         ${products}`);
    console.log(`UOMs (หน่วยนับ):           ${uoms}`);
    console.log(`Product UOMs:              ${productUoms}`);
    console.log(`Movement Types:            ${movementTypes}`);
    console.log(`Document Types:            ${documentTypes}`);

    // Stock Data
    console.log('\n📊 STOCK DATA');
    console.log('----------------------------------------');

    const stocks = await prisma.stock.count();
    const stockDates = await prisma.stockDate.count();

    console.log(`Stock (ยอดสต๊อก):          ${stocks}`);
    console.log(`Stock Dates (วันผลิต):     ${stockDates}`);

    // Transaction Data
    console.log('\n📄 TRANSACTION DATA');
    console.log('----------------------------------------');

    const headers = await prisma.transactionHeader.count();
    const details = await prisma.transactionDetail.count();
    const byType = await prisma.transactionHeader.groupBy({
        by: ['docTypeCode'],
        _count: true
    });

    console.log(`Transaction Headers:       ${headers}`);
    console.log(`Transaction Details:       ${details}`);
    console.log('\nBreakdown by Document Type:');
    byType.forEach(t => {
        console.log(`  ${t.docTypeCode}: ${t._count} documents`);
    });

    // Logs
    console.log('\n📝 LOGS');
    console.log('----------------------------------------');

    let activityLogs = 0;
    let stockLogs = 0;
    try {
        activityLogs = await prisma.activityLog.count();
        stockLogs = await prisma.stockLog.count();
    } catch (e) {
        // Tables might not exist
    }

    console.log(`Activity Logs:             ${activityLogs}`);
    console.log(`Stock Logs:                ${stockLogs}`);

    // Total
    const total = principals + brands + warehouses + locations + users +
        products + uoms + productUoms + movementTypes + documentTypes +
        stocks + stockDates + headers + details;

    console.log('\n========================================');
    console.log(`   TOTAL RECORDS: ${total.toLocaleString()}`);
    console.log('========================================');

    await prisma.$disconnect();
}

main();
