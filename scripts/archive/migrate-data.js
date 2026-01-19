// Script สำหรับ Migrate Stock Data - Final Version
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

const stats = {
    locations: { total: 0, migrated: 0, errors: 0 },
    stockDates: { total: 0, migrated: 0, errors: 0 },
    stocks: { total: 0, migrated: 0, errors: 0 },
};

async function createDefaultLocations() {
    console.log('\n📋 Creating default locations for warehouses...');

    // Get all warehouses
    const warehouses = await prisma.warehouse.findMany();
    stats.locations.total = warehouses.length;

    for (const wh of warehouses) {
        try {
            await prisma.location.upsert({
                where: {
                    whCode_locCode: {
                        whCode: wh.whCode,
                        locCode: '',
                    },
                },
                update: {},
                create: {
                    whCode: wh.whCode,
                    locCode: '',
                    locName: 'Default',
                    status: 'ACTIVE',
                },
            });
            stats.locations.migrated++;
        } catch (e) {
            console.error(`  ❌ Location ${wh.whCode}:`, e.message.substring(0, 80));
            stats.locations.errors++;
        }
    }
    console.log(`  ✅ Locations: ${stats.locations.migrated}/${stats.locations.total}`);
}

async function migrateStockDates() {
    console.log('\n📋 Migrating Stock Dates (MFG/EXP)...');

    const { rows } = await legacyClient.query(`
        SELECT sd.productcode, sd.whcode, sd.mfgdate, sd.expdate, sd.balance
        FROM stockdates sd
        INNER JOIN products p ON sd.productcode = p.productcode
        INNER JOIN warehouses w ON sd.whcode = w.whcode
        WHERE sd.balance > 0 
          AND p.status = 'ACTIVE' 
          AND w.status = 'ACTIVE'
          AND sd.mfgdate IS NOT NULL
          AND sd.expdate IS NOT NULL
    `);
    stats.stockDates.total = rows.length;

    console.log('  🗑️ Clearing existing stock data...');
    await prisma.stockDate.deleteMany({});
    await prisma.stock.deleteMany({});

    let count = 0;
    for (const row of rows) {
        try {
            await prisma.stockDate.upsert({
                where: {
                    productCode_whCode_locCode_mfgDate_expDate: {
                        productCode: row.productcode,
                        whCode: row.whcode,
                        locCode: '',
                        mfgDate: new Date(row.mfgdate),
                        expDate: new Date(row.expdate),
                    }
                },
                update: {
                    balance: parseInt(row.balance) || 0,
                    qty: row.balance || 0,
                },
                create: {
                    productCode: row.productcode,
                    whCode: row.whcode,
                    locCode: '',
                    mfgDate: new Date(row.mfgdate),
                    expDate: new Date(row.expdate),
                    balance: parseInt(row.balance) || 0,
                    qty: row.balance || 0,
                },
            });
            stats.stockDates.migrated++;
            count++;
            if (count % 100 === 0) {
                console.log(`  ... ${count} stock dates processed`);
            }
        } catch (e) {
            console.error(`  ❌ ${row.productcode} (${row.whcode}):`, e.message.substring(0, 100));
            stats.stockDates.errors++;
        }
    }
    console.log(`  ✅ Stock Dates: ${stats.stockDates.migrated}/${stats.stockDates.total}`);
}

async function aggregateStocks() {
    console.log('\n📊 Aggregating to Stock table...');

    const aggregated = await prisma.stockDate.groupBy({
        by: ['productCode', 'whCode'],
        _sum: { balance: true },
    });

    stats.stocks.total = aggregated.length;

    for (const item of aggregated) {
        try {
            await prisma.stock.upsert({
                where: {
                    productCode_whCode_locCode: {
                        productCode: item.productCode,
                        whCode: item.whCode,
                        locCode: '',
                    },
                },
                update: {
                    balance: item._sum.balance || 0,
                    qty: item._sum.balance || 0,
                },
                create: {
                    productCode: item.productCode,
                    whCode: item.whCode,
                    locCode: '',
                    balance: item._sum.balance || 0,
                    qty: item._sum.balance || 0,
                },
            });
            stats.stocks.migrated++;
        } catch (e) {
            console.error(`  ❌ Stock ${item.productCode}:`, e.message.substring(0, 80));
            stats.stocks.errors++;
        }
    }
    console.log(`  ✅ Stocks: ${stats.stocks.migrated}/${stats.stocks.total}`);
}

async function main() {
    console.log('='.repeat(70));
    console.log('🚀 Data Migration: Stock Data (Final)');
    console.log('='.repeat(70));

    try {
        await legacyClient.connect();
        console.log('✅ Connected');

        await createDefaultLocations(); // สร้าง locations ก่อน!
        await migrateStockDates();
        await aggregateStocks();

        console.log('\n' + '='.repeat(70));
        console.log('📊 Summary');
        console.log('='.repeat(70));
        console.table(stats);
        console.log('\n✅ Migration completed!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
    } finally {
        await legacyClient.end();
        await prisma.$disconnect();
    }
}

main();
