import { Client } from 'pg';

async function main() {
    const client = new Client({ user: 'postgres', host: '127.0.0.1', password: 'S1r1Pr0', port: 5432, database: 'spwms_new' });
    try {
        await client.connect();
        const tables = ['users', 'branches', 'principals', 'movement_types', 'document_types', 'uoms', 'warehouses', 'brands', 'products', 'product_uoms', 'transaction_headers', 'transaction_details', 'stocks', 'stock_dates', 'document_numbers'];
        for (const table of tables) {
            const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}' ORDER BY ordinal_position`);
            console.log(`- ${table}: ${res.rows.map(r => r.column_name).join(', ')}`);
        }
    } finally {
        await client.end();
    }
}
main();
