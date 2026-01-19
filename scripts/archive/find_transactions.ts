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
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND (table_name ILIKE '%trans%' OR table_name ILIKE '%detail%')
      `);

            for (const row of res.rows) {
                const countRes = await client.query(`SELECT COUNT(*) FROM "${row.table_name}"`);
                const count = parseInt(countRes.rows[0].count);
                if (count > 0) {
                    console.log(`- DB [${dbName}] Table [${row.table_name}]: ${count} rows`);
                }
            }
        } catch (err) {
        } finally {
            await client.end();
        }
    }
}

main();
