const { Client } = require('pg');
const { PrismaClient } = require('@prisma/client');

const legacyClient = new Client({
    host: '192.168.10.15',
    port: 5432,
    database: 'siripro-stock',
    user: 'postgres',
    password: 'S1r1Pr0',
});

const prisma = new PrismaClient();

async function migrateUOMs() {
    console.log('📋 Migrating UOM Master Data...');
    const { rows: legacyUOMs } = await legacyClient.query('SELECT * FROM uoms');

    for (const uom of legacyUOMs) {
        try {
            await prisma.uOM.upsert({
                where: { uomCode: uom.uomcode },
                update: { uomName: uom.uomname, status: uom.status },
                create: {
                    uomCode: uom.uomcode,
                    uomName: uom.uomname,
                    status: uom.status,
                },
            });
            console.log(`  ✅ UOM: ${uom.uomcode} (${uom.uomname})`);
        } catch (e) {
            console.error(`  ❌ Error migrating UOM ${uom.uomcode}:`, e.message);
        }
    }
}

async function migrateProductUOMs() {
    console.log('\n📋 Migrating Product UOM mappings...');
    const { rows: legacyProductUOMs } = await legacyClient.query('SELECT * FROM productuoms');

    let migratedCount = 0;
    let errorCount = 0;

    for (const pu of legacyProductUOMs) {
        try {
            // Check if product exists in new system
            const product = await prisma.product.findUnique({
                where: { productCode: pu.productcode },
            });

            if (!product) {
                // Skip if product doesn't exist to avoid FKey errors
                continue;
            }

            await prisma.productUOM.upsert({
                where: {
                    productCode_uomCode: {
                        productCode: pu.productcode,
                        uomCode: pu.uomcode,
                    },
                },
                update: {
                    uomRatio: parseInt(pu.uomratio) || 1,
                    status: pu.status,
                },
                create: {
                    productCode: pu.productcode,
                    uomCode: pu.uomcode,
                    uomRatio: parseInt(pu.uomratio) || 1,
                    status: pu.status,
                },
            });
            migratedCount++;
            if (migratedCount % 100 === 0) {
                console.log(`  ... ${migratedCount} product UOMs processed`);
            }
        } catch (e) {
            console.error(`  ❌ Error migrating ProductUOM ${pu.productcode}-${pu.uomcode}:`, e.message);
            errorCount++;
        }
    }
    console.log(`\n✅ ProductUOM Migration completed: ${migratedCount} migrated, ${errorCount} errors.`);
}

async function main() {
    try {
        await legacyClient.connect();
        console.log('✅ Connected to legacy database');

        await migrateUOMs();
        await migrateProductUOMs();

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await legacyClient.end();
        await prisma.$disconnect();
    }
}

main();
