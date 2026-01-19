import { Client } from 'pg';
async function main() {
    const client = new Client({ user: 'postgres', host: '127.0.0.1', password: 'S1r1Pr0', port: 5432, database: 'spwms_new' });
    await client.connect();
    const res = await client.query("SELECT doc_no FROM transaction_headers WHERE doc_no = 'TX202302-0050'");
    console.log(res.rows);
    await client.end();
}
main();
