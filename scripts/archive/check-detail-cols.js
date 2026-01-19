// Quick script to check transaction_details columns
const { Client } = require('pg');

const client = new Client({
    host: '192.168.10.15',
    port: 5432,
    database: 'siripro-stock',
    user: 'postgres',
    password: 'S1r1Pr0',
});

async function main() {
    await client.connect();
    const cols = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'transaction_details'
    `);
    console.log('Columns:', cols.rows.map(r => r.column_name).join(', '));

    // Get sample data
    const sample = await client.query('SELECT * FROM transaction_details LIMIT 1');
    console.log('\nSample row keys:', Object.keys(sample.rows[0] || {}).join(', '));

    await client.end();
}

main();
