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
        SELECT schema_name FROM information_schema.schemata 
        WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      `);

            if (res.rows.length > 0) {
                // console.log(`DB [${dbName}] extra schemas: ${res.rows.map(r => r.schema_name).join(', ')}`);
                for (const schema of res.rows) {
                    const tables = await client.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = '${schema.schema_name}'
          `);
                    for (const table of tables.rows) {
                        const countRes = await client.query(`SELECT COUNT(*) FROM "${schema.schema_name}"."${table.table_name}"`);
                        const count = parseInt(countRes.rows[0].count);
                        if (count > 0 && (table.table_name.includes('product') || table.table_name.includes('uom'))) {
                            console.log(`- DB [${dbName}] Schema [${schema.schema_name}] Table [${table.table_name}]: ${count} rows`);
                        }
                    }
                }
            }
        } catch (err) {
        } finally {
            await client.end();
        }
    }
}

main();
