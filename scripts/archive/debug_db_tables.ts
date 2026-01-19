import { Client } from 'pg';

async function main() {
    const client = new Client({
        user: 'postgres',
        host: '127.0.0.1',
        password: 'S1r1Pr0',
        port: 5432,
        database: 'siripro-stock'
    });

    try {
        await client.connect();
        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log('Tables in siripro-stock (public schema):');
        res.rows.forEach(r => console.log(`- ${r.table_name}`));

        // Check row count for some tables
        const prodCount = await client.query('SELECT COUNT(*) FROM products');
        console.log(`Products count: ${prodCount.rows[0].count}`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

main();
