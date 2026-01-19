import { Client } from 'pg';

async function main() {
    const client = new Client({
        user: 'postgres', host: '127.0.0.1', password: 'S1r1Pr0', port: 5432,
        database: 'siripro-stock'
    });

    try {
        await client.connect();
        const res = await client.query("SELECT srvname FROM pg_foreign_server");
        console.log('Foreign Servers in siripro-stock:');
        res.rows.forEach(r => console.log(`- ${r.srvname}`));

        const wrapper = await client.query("SELECT fdwname FROM pg_foreign_data_wrapper");
        console.log('Foreign Data Wrappers:');
        wrapper.rows.forEach(r => console.log(`- ${r.fdwname}`));
    } catch (err) {
        // console.log('Error checking FDWs:', err.message);
    } finally {
        await client.end();
    }
}

main();
