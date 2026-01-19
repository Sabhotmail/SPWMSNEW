// Sync Movement Types from Legacy Database (using stocksign)
const { Client } = require('pg');
const { PrismaClient } = require('@prisma/client');

const legacyClient = new Client({
    host: '192.168.10.15',
    port: 5432,
    database: 'siripro-stock',
    user: 'postgres',
    password: 'S1r1Pr0'
});

const prisma = new PrismaClient();

async function main() {
    await legacyClient.connect();
    console.log('=== Connected to Legacy Database ===\n');

    // Get all movement types from legacy
    const result = await legacyClient.query(`
        SELECT movementtypecode, movementtypename, stocksign, status 
        FROM movementtypes 
        ORDER BY movementtypecode
    `);

    console.log('=== Legacy Movement Types ===');
    console.table(result.rows.map(r => ({
        code: r.movementtypecode,
        name: r.movementtypename,
        stocksign: r.stocksign,
        direction: r.stocksign === 1 ? 'IN' : 'OUT',
        status: r.status
    })));

    // Update new system to match legacy
    console.log('\n=== Syncing to New System ===');
    for (const row of result.rows) {
        const direction = row.stocksign === 1 ? 'IN' : 'OUT';
        try {
            await prisma.movementType.upsert({
                where: { movementTypeCode: row.movementtypecode },
                update: {
                    movementTypeName: row.movementtypename,
                    direction: direction,
                    status: row.status
                },
                create: {
                    movementTypeCode: row.movementtypecode,
                    movementTypeName: row.movementtypename,
                    direction: direction,
                    status: row.status
                }
            });
            console.log(`✅ ${row.movementtypecode}: ${row.movementtypename} (${direction})`);
        } catch (err) {
            console.log(`❌ ${row.movementtypecode}: ${err.message}`);
        }
    }

    // Show final result
    console.log('\n=== New System Movement Types (After Sync) ===');
    const final = await prisma.movementType.findMany({ orderBy: { movementTypeCode: 'asc' } });
    console.table(final.map(m => ({
        code: m.movementTypeCode,
        name: m.movementTypeName,
        direction: m.direction,
        status: m.status
    })));

    await legacyClient.end();
    await prisma.$disconnect();
}

main();
