import { Client } from 'pg';

async function main() {
    const client = new Client({
        user: 'postgres', host: '127.0.0.1', password: 'S1r1Pr0', port: 5432,
        database: 'siripro-stock'
    });

    try {
        await client.connect();
        const res = await client.query("SELECT schema_name FROM information_schema.schemata");
        console.log('Schemas in siripro-stock:');
        res.rows.forEach(r => console.log(`- ${r.schema_name}`));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

main();
