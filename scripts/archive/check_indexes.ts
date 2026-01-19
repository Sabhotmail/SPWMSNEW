import { Client } from 'pg';
async function main() {
    const client = new Client({ user: 'postgres', host: '127.0.0.1', password: 'S1r1Pr0', port: 5432, database: 'spwms_new' });
    await client.connect();
    const res = await client.query(`SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'movement_types'`);
    res.rows.forEach(r => console.log(r));
    await client.end();
}
main();
