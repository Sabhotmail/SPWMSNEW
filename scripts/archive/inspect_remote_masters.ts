import { Client } from 'pg';

async function main() {
    const client = new Client({ user: 'postgres', host: '192.168.10.15', password: 'S1r1Pr0', port: 5432, database: 'siripro-stock' });
    try {
        await client.connect();
        const tables = ['users', 'branches', 'principals', 'movementtypes', 'documenttypes', 'uoms', 'warehouses', 'brands'];
        for (const table of tables) {
            const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}' ORDER BY ordinal_position`);
            console.log(`- ${table}: ${res.rows.map(r => r.column_name).join(', ')}`);
        }
    } finally {
        await client.end();
    }
}
main();
