const { Client } = require('pg');

const client = new Client({
    host: '192.168.10.15',
    port: 5432,
    database: 'siripro-stock',
    user: 'postgres',
    password: 'S1r1Pr0',
});

async function main() {
    try {
        await client.connect();

        const schema = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'products'
        `);
        console.log('Columns in legacy products table:');
        console.log(schema.rows.map(r => r.column_name).join(', '));

        const sample = await client.query('SELECT * FROM products LIMIT 1');
        console.log('\nSample Product Row:');
        console.log(JSON.stringify(sample.rows[0], null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.end();
    }
}

main();
