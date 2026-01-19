import { Client } from 'pg';

async function main() {
    const client = new Client({
        user: 'postgres', host: '127.0.0.1', password: 'S1r1Pr0', port: 5432,
        database: 'inventory_db'
    });

    try {
        await client.connect();
        const res = await client.query("SELECT COUNT(*) FROM products").catch(e => ({ rows: [{ count: 'Table products not found' }] }));
        console.log(`inventory_db - Products count: ${res.rows[0].count}`);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

main();
