import { Client } from 'pg';
async function main() {
    const client = new Client({ user: 'postgres', host: '127.0.0.1', password: 'S1r1Pr0', port: 5432, database: 'spwms_new' });
    await client.connect();
    const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'transaction_headers' ORDER BY ordinal_position`);
    console.log('Columns:', res.rows.map(r => r.column_name));
    await client.end();
}
main();
