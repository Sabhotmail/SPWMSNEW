import { Client } from 'pg';
async function main() {
    const client = new Client({ user: 'postgres', host: '127.0.0.1', password: 'S1r1Pr0', port: 5432, database: 'spwms_new' });
    await client.connect();
    const res = await client.query('SELECT * FROM movement_types');
    console.log(res.rows);
    await client.end();
}
main();
