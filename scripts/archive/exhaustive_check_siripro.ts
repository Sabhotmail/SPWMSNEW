import { Client } from 'pg';

async function main() {
    const client = new Client({
        user: 'postgres',
        host: '127.0.0.1',
        password: 'S1r1Pr0',
        port: 5432,
        database: 'siripro-stock'
    });

    try {
        await client.connect();
        console.log('Connected to siripro-stock');

        const res = await client.query(`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY schemaname, tablename;
    `);

        console.log('Tables and Row Counts:');
        for (const row of res.rows) {
            const countRes = await client.query(`SELECT COUNT(*) FROM "${row.schemaname}"."${row.tablename}"`);
            const count = countRes.rows[0].count;
            if (parseInt(count) > 0) {
                console.log(`- ${row.schemaname}.${row.tablename}: ${count} rows`);
            } else {
                // console.log(`- ${row.schemaname}.${row.tablename}: 0 rows`);
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

main();
