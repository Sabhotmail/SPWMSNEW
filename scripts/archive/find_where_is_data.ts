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
    `);

        let found = false;
        for (const row of res.rows) {
            try {
                const countRes = await client.query(`SELECT COUNT(*) FROM "${row.table_name}"`);
                const count = parseInt(countRes.rows[0].count);
                if (count > 0 && (row.table_name === 'products' || row.table_name === 'product_uoms' || row.table_name === 'productuoms')) {
                    if (!found) {
                        console.log(`\nDATABASE: ${dbName}`);
                        found = true;
                    }
                    console.log(`  - ${row.table_name}: ${count}`);
                }
            } catch (e) { }
        }
    } catch (err) {
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
