import { Client } from 'pg';
async function main() {
    const client = new Client({ user: 'postgres', host: '192.168.10.15', password: 'S1r1Pr0', port: 5432, database: 'siripro-stock' });
    await client.connect();
    const res = await client.query("SELECT * FROM transaction_headers LIMIT 1");
    console.log(JSON.stringify(res.rows[0], null, 2));
    await client.end();
}
main();
