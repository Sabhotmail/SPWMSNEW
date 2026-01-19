// วิเคราะห์ pattern รหัสสินค้าเพื่อกำหนด Principal
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyze() {
    // ดู prefix ของสินค้าทั้งหมด
    const products = await prisma.product.findMany({
        select: { productCode: true, productName: true }
    });

    // Group by first 3 digits
    const prefixes = {};
    products.forEach(p => {
        const prefix = p.productCode.substring(0, 3);
        if (!prefixes[prefix]) {
            prefixes[prefix] = { count: 0, samples: [] };
        }
        prefixes[prefix].count++;
        if (prefixes[prefix].samples.length < 2) {
            prefixes[prefix].samples.push(p.productName);
        }
    });

    console.log('📊 รหัสสินค้า Prefix Analysis:');
    console.log('='.repeat(60));
    Object.keys(prefixes).sort().forEach(prefix => {
        console.log(`${prefix}xxx: ${prefixes[prefix].count} รายการ`);
        prefixes[prefix].samples.forEach(s => console.log(`       └─ ${s}`));
    });

    await prisma.$disconnect();
}

analyze();
