import { Client } from 'pg';

async function main() {
    const client = new Client({
        user: 'postgres',
        host: '192.168.10.15',
        password: 'S1r1Pr0',
        port: 5432,
        database: 'siripro-stock',
    });

    try {
        await client.connect();
        const tables = ['products', 'productuoms', 'transaction_headers', 'transaction_details'];

        for (const table of tables) {
            const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${table}'
        ORDER BY ordinal_position
      `);
            console.log(`\nColumns for ${table}:`);
            res.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

main();
