import { Client } from 'pg';
async function main() {
    const client = new Client({ user: 'postgres', host: '192.168.10.15', password: 'S1r1Pr0', port: 5432, database: 'siripro-stock' });
    await client.connect();
    const res = await client.query('SELECT DISTINCT direction FROM movementtypes');
    console.log('Remote directions:', res.rows.map(r => r.direction));
    await client.end();
}
main();
