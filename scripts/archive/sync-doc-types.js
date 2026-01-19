// Check and Sync Document Types from Legacy Database
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

    // First check the table structure
    const cols = await legacyClient.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'documenttypes'
        ORDER BY ordinal_position
    `);
    console.log('=== Legacy Document Types Columns ===');
    console.table(cols.rows);

    // Get all document types from legacy
    const result = await legacyClient.query(`
        SELECT * FROM documenttypes ORDER BY doctypecode
    `);

    console.log('\n=== Legacy Document Types ===');
    if (result.rows.length > 0) {
        console.log('Keys:', Object.keys(result.rows[0]));
        console.table(result.rows);
    }

    // Sync to new system
    console.log('\n=== Syncing to New System ===');
    for (const row of result.rows) {
        // Determine movement type from the code
        let movementType = 'IN';
        if (row.doctypecode === 'OUT' || row.doctypecode === 'GI') {
            movementType = 'OUT';
        } else if (row.doctypecode === 'TRN') {
            movementType = 'OUT'; // Transfer is outbound
        }

        try {
            await prisma.documentType.upsert({
                where: { docTypeCode: row.doctypecode },
                update: {
                    docTypeName: row.doctypename,
                    movementType: movementType,
                    status: row.status || 'ACTIVE'
                },
                create: {
                    docTypeCode: row.doctypecode,
                    docTypeName: row.doctypename,
                    movementType: movementType,
                    status: row.status || 'ACTIVE'
                }
            });
            console.log(`✅ ${row.doctypecode}: ${row.doctypename} (${movementType})`);
        } catch (err) {
            console.log(`❌ ${row.doctypecode}: ${err.message}`);
        }
    }

    // Show final result
    console.log('\n=== New System Document Types (After Sync) ===');
    const final = await prisma.documentType.findMany({ orderBy: { docTypeCode: 'asc' } });
    console.table(final.map(d => ({
        code: d.docTypeCode,
        name: d.docTypeName,
        movement: d.movementType,
        status: d.status
    })));

    await legacyClient.end();
    await prisma.$disconnect();
}

main();
