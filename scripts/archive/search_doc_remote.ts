import { Client } from 'pg';
async function main() {
    const client = new Client({ user: 'postgres', host: '192.168.10.15', password: 'S1r1Pr0', port: 5432, database: 'siripro-stock' });
    await client.connect();
    const res = await client.query(`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND (data_type = 'character varying' OR data_type = 'text')
  `);

    for (const row of res.rows) {
        try {
            const search = await client.query(`SELECT COUNT(*) FROM "${row.table_name}" WHERE "${row.column_name}" = 'TX202302-0050'`);
            if (parseInt(search.rows[0].count) > 0) {
                console.log(`Found 'TX202302-0050' in ${row.table_name}.${row.column_name}: ${search.rows[0].count} times`);
            }
        } catch (e) { }
    }
    await client.end();
}
main();
