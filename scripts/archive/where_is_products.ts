import { Client } from 'pg';

const dbs = [
    'postgres', 'helpdesk', 'salesgps', 'Parcel', 'itasset', 'tablet',
    'inventory_db', 'ithelpdesk', 'it_support', 'it_ticketing', 'ricohdb',
    'gps', 'siripro-stock', 'spwms_new', 'it_helpdesk'
];

async function main() {
    for (const dbName of dbs) {
        const client = new Client({
            user: 'postgres', host: '127.0.0.1', password: 'S1r1Pr0', port: 5432,
            database: dbName
        });

        try {
            await client.connect();
            const res = await client.query(`
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'products'
      `);

            if (res.rows[0].count > 0) {
                const rowCount = await client.query('SELECT COUNT(*) FROM products');
                console.log(`DB [${dbName}] has products table with ${rowCount.rows[0].count} rows`);
            }
        } catch (err) {
        } finally {
            await client.end();
        }
    }
}

main();
