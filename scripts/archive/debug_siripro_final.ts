import { Client } from 'pg';

async function main() {
    const client = new Client({
        user: 'postgres', host: '127.0.0.1', password: 'S1r1Pr0', port: 5432, database: 'siripro-stock'
    });

    try {
        await client.connect();
        console.log('Connected to siripro-stock');

        // Check schemas
        const schemas = await client.query("SELECT schema_name FROM information_schema.schemata");
        console.log('Schemas:', schemas.rows.map(r => r.schema_name));

        // Check tables in public
        const tables = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
        console.log('Tables in public:', tables.rows.map(r => r.tablename));

        // Try to count products
        const count = await client.query('SELECT COUNT(*) FROM products');
        console.log('Products count (no quotes):', count.rows[0].count);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

main();
