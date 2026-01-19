import { Client } from 'pg';
async function main() {
    const client = new Client({ user: 'postgres', host: '192.168.10.15', password: 'S1r1Pr0', port: 5432, database: 'siripro-stock' });
    await client.connect();
    const res = await client.query('SELECT movementtypecode FROM movementtypes');
    console.log('Remote movementtypecodes:', res.rows.map(r => r.movementtypecode));
    await client.end();
}
main();
