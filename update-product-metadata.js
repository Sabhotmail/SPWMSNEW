const { Client } = require('pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const legacyConfig = {
    host: process.env.LEGACY_DB_HOST,
    port: parseInt(process.env.LEGACY_DB_PORT),
    database: process.env.LEGACY_DB_NAME,
    user: process.env.LEGACY_DB_USER,
    password: process.env.LEGACY_DB_PASSWORD,
};

const prisma = new PrismaClient();

async function updateProductMetadata() {
    const legacy = new Client(legacyConfig);
    try {
        console.log('🚀 เริ่มการอัปเดตข้อมูล Metadata ของสินค้าจากระบบเก่า...');
        await legacy.connect();

        const res = await legacy.query('SELECT * FROM products');
        const legacyProducts = res.rows;
        console.log(`📦 พบสินค้า ${legacyProducts.length} รายการในระบบเก่า`);

        let updatedCount = 0;
        for (const p of legacyProducts) {
            const code = p.product_code || p.productcode;

            // Check if product exists in new DB
            const exists = await prisma.product.findUnique({
                where: { productCode: code }
            });

            if (exists) {
                await prisma.product.update({
                    where: { productCode: code },
                    data: {
                        shelfLife: parseInt(p.shelflife) || 0,
                        maxMfgDays: parseInt(p.maxmfgdays) || 0,
                        stockControl: p.stockcontrol || 'FEFO',
                        caseWeight: p.caseweight || 0,
                        caseWidth: p.casewidth || 0,
                        caseLength: p.caselength || 0,
                        caseHeight: p.caseheight || 0,
                        caseVolume: p.casevolume || 0,
                        allowPartialIn: p.allowpartialin || 'YES',
                        allowPartialOut: p.allowpartialout || 'YES',
                        pieceBarcode: p.piecebarcode || null,
                        packBarcode: p.packbarcode || null,
                        innerBarcode: p.innerbarcode || null,
                        caseBarcode: p.casebarcode || null,
                        principalProductCode: p.principalproductcode || null,
                        imgPath: p.imgpath || null
                    }
                });
                updatedCount++;
            }
        }

        console.log(`✅ อัปเดตข้อมูลสินค้าสำเร็จ ${updatedCount} รายการ`);

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await legacy.end();
        await prisma.$disconnect();
    }
}

updateProductMetadata();
