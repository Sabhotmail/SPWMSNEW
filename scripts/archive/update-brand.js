// สร้าง Brands และอัพเดท brandCode ให้สินค้า
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// กำหนด Brands ตามรหัสสินค้า
const brands = [
    { brandCode: 'JELE', brandName: 'เจเล่' },
    { brandCode: 'SKINLAB', brandName: 'สกินแล็บ' },
    { brandCode: 'BABYBRIGHT', brandName: 'เบบี้ไบร์ท' },
    { brandCode: 'FULLO', brandName: 'ฟูลโล' },
    { brandCode: 'YOOPY', brandName: 'ยูปี้' },
    { brandCode: 'SOM', brandName: 'โสม' },
    { brandCode: 'HICHEF', brandName: 'ไฮเชฟ' },
    { brandCode: 'MACHITA', brandName: 'มาชิตะ' },
    { brandCode: 'TURTLE', brandName: 'เต่าเหยียบโลก' },
    { brandCode: 'TASUKO', brandName: 'ทาสุโกะ' },
    { brandCode: 'YOKZOD', brandName: 'ยกซด' },
    { brandCode: 'CAPTAIN', brandName: 'กัปตันเรือ' },
    { brandCode: 'LIO', brandName: 'ไลโอ' },
    { brandCode: 'JIWHERB', brandName: 'จิวะเฮิร์บ' },
    { brandCode: 'MERPH', brandName: 'เมิร์ฟ' },
    { brandCode: 'LOOKPED', brandName: 'ลูกเผ็ด' },
    { brandCode: 'PEPPERFIELD', brandName: 'เป๊ปเปอรมิ้นฟิลด์' },
    { brandCode: 'DREAMY', brandName: 'ดรีมมี่' },
    { brandCode: 'CARAMUJO', brandName: 'คารามูโจ้' },
    { brandCode: 'CWN', brandName: 'CWN' },
    { brandCode: 'PRIRANA', brandName: 'พรีราน่า' },
    { brandCode: 'PREMIUM', brandName: 'พรีเมียม' },
    { brandCode: 'HANAMI', brandName: 'ฮานามิ' },
];

// Mapping รหัสสินค้า prefix → brandCode
const prefixToBrand = {
    '1010010': 'JELE',       // เจเล่บิวตี้
    '1010020': 'JELE',       // เจเล่
    '1010030': 'JELE',       // เจเล่
    '1010040': 'JELE',       // เจเล่
    '1010050': 'JELE',       // เจเล่
    '1010060': 'SKINLAB',    // สกินแล็บ
    '1010070': 'HANAMI',     // ฮานามิ
    '1010080': 'HANAMI',     // ฮานามิ
    '1010090': 'HANAMI',     // ฮานามิ
    '1010100': 'HANAMI',     // ฮานามิ
    '1010110': 'HANAMI',     // ฮานามิ
    '1010120': 'HANAMI',     // ฮานามิ
    '1010130': 'HANAMI',     // ฮานามิ
    '1010140': 'HANAMI',     // ฮานามิ
    '1010150': 'HANAMI',     // ฮานามิ
    '1010160': 'HANAMI',     // ฮานามิ
    '1020010': 'SKINLAB',    // สกินแล็บ
    '1020020': 'BABYBRIGHT', // เบบี้ไบร์ท
    '1020030': 'BABYBRIGHT', // เบบี้ไบร์ท
    '1050010': 'FULLO',      // ฟูลโล
    '1050020': 'YOOPY',      // ยูปี้
    '1080010': 'SOM',        // โสม
    '1100010': 'HICHEF',     // ไฮเชฟ
    '1110010': 'MACHITA',    // มาชิตะ
    '1110020': 'MACHITA',    // มาชิตะ
    '1120010': 'TURTLE',     // เต่าเหยียบโลก
    '1130010': 'TASUKO',     // ทาสุโกะ
    '1140010': 'YOKZOD',     // ยกซด
    '1150010': 'CAPTAIN',    // กัปตันเรือ
    '1160010': 'LIO',        // ไลโอ
    '1170010': 'JIWHERB',    // จิวะเฮิร์บ
    '1170020': 'JIWHERB',    // จิวะเฮิร์บ
    '1180010': 'MERPH',      // เมิร์ฟ
    '1190010': 'LOOKPED',    // ลูกเผ็ด
    '1200010': 'PEPPERFIELD',// เป๊ปเปอรมิ้นฟิลด์
    '1210010': 'DREAMY',     // ดรีมมี่
    '1220010': 'CARAMUJO',   // คารามูโจ้
    '1230010': 'CWN',        // CWN
    '1230011': 'CWN',        // CWN
    '1240010': 'PRIRANA',    // พรีราน่า
    '401': 'PREMIUM',        // พรีเมียม
    '403': 'PREMIUM',        // พรีเมียม
    '404': 'PREMIUM',        // พรีเมียม
    '408': 'PREMIUM',        // พรีเมียม
    '422': 'PREMIUM',        // พรีเมียม
};

async function main() {
    console.log('📋 กำลังสร้าง Brands...\n');

    // 1. สร้าง Brands
    for (const brand of brands) {
        await prisma.brand.upsert({
            where: { brandCode: brand.brandCode },
            update: { brandName: brand.brandName },
            create: { ...brand, status: 'ACTIVE' },
        });
    }
    console.log(`✅ สร้าง Brands ${brands.length} รายการ`);

    // 2. อัพเดท brandCode ใน Products
    console.log('\n🔄 กำลังอัพเดท brandCode...\n');
    let totalUpdated = 0;

    for (const [prefix, brandCode] of Object.entries(prefixToBrand)) {
        const result = await prisma.product.updateMany({
            where: {
                productCode: { startsWith: prefix },
                brandCode: null,
            },
            data: { brandCode }
        });

        if (result.count > 0) {
            console.log(`  ${prefix}xxx → ${brandCode}: ${result.count} รายการ`);
            totalUpdated += result.count;
        }
    }

    console.log('\n' + '='.repeat(40));
    console.log(`✅ อัพเดท brandCode สำเร็จ ${totalUpdated} รายการ`);

    await prisma.$disconnect();
}

main();
