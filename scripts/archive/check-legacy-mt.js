// Check Legacy Movement Types columns
const { Client } = require('pg');

const legacyClient = new Client({
    host: '192.168.10.15',
    port: 5432,
    database: 'siripro-stock',
    user: 'postgres',
    password: 'S1r1Pr0'
});

async function main() {
    await legacyClient.connect();
    console.log('=== Legacy Movement Types Structure ===\n');

    // Get all columns
    const cols = await legacyClient.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'movementtypes'
        ORDER BY ordinal_position
    `);
    console.log('Columns:');
    console.table(cols.rows);

    // Get sample data
    const sample = await legacyClient.query(`SELECT * FROM movementtypes LIMIT 5`);
    console.log('\nSample Data:');
    if (sample.rows.length > 0) {
        console.log('Keys:', Object.keys(sample.rows[0]));
        console.table(sample.rows);
    }

    await legacyClient.end();
}

main();
