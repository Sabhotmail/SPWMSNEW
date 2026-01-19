import { Client } from 'pg';

const dbs = [
    'postgres', 'helpdesk', 'salesgps', 'Parcel', 'itasset', 'tablet',
    'inventory_db', 'ithelpdesk', 'it_support', 'it_ticketing', 'ricohdb',
    'gps', 'siripro-stock', 'spwms_new', 'it_helpdesk'
];

async function checkDb(dbName: string) {
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
      AND (table_name ILIKE '%prod%' OR table_name ILIKE '%uom%')
    `);

        if (res.rows.length > 0) {
            console.log(`- Database [${dbName}] has tables: ${res.rows.map(r => r.table_name).join(', ')}`);
            for (const row of res.rows) {
                const countRes = await client.query(`SELECT COUNT(*) FROM "${row.table_name}"`);
                console.log(`  - ${row.table_name}: ${countRes.rows[0].count} rows`);
            }
        }
    } catch (err) {
        // console.log(`- Database [${dbName}] error: ${err.message}`);
    } finally {
        await client.end();
    }
}

async function main() {
    for (const db of dbs) {
        await checkDb(db);
    }
}

main();
