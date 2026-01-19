// Script ทดสอบ upsert 1 record เพื่อดู error เต็มๆ
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

async function main() {
    try {
        await legacyClient.connect();
        console.log('✅ Connected\n');

        // Get one sample
        const { rows } = await legacyClient.query(`
            SELECT sd.productcode, sd.whcode, sd.mfgdate, sd.expdate, sd.balance
            FROM stockdates sd
            INNER JOIN products p ON sd.productcode = p.productcode
            INNER JOIN warehouses w ON sd.whcode = w.whcode
            WHERE sd.balance > 0 AND p.status = 'ACTIVE' AND w.status = 'ACTIVE'
              AND sd.mfgdate IS NOT NULL AND sd.expdate IS NOT NULL
            LIMIT 1
        `);

        const row = rows[0];
        console.log('Sample row:', row);
        console.log('mfgDate type:', typeof row.mfgdate, row.mfgdate);
        console.log('expDate type:', typeof row.expdate, row.expdate);

        // Try to create directly
        console.log('\n📋 Trying to create StockDate...');
        const result = await prisma.stockDate.create({
            data: {
                productCode: row.productcode,
                whCode: row.whcode,
                locCode: '',
                mfgDate: new Date(row.mfgdate),
                expDate: new Date(row.expdate),
                balance: parseInt(row.balance) || 0,
                qty: row.balance || 0,
            },
        });
        console.log('✅ Success:', result);

    } catch (error) {
        console.error('\n❌ Full Error:');
        console.error(error);
    } finally {
        await legacyClient.end();
        await prisma.$disconnect();
    }
}

main();
