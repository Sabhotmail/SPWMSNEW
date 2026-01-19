import { Client } from 'pg';

async function main() {
    const client = new Client({
        user: 'postgres',
        host: '127.0.0.1',
        password: 'S1r1Pr0',
        port: 5432,
        database: 'postgres' // Connect to default postgres db
    });

    try {
        await client.connect();
        const res = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false;');
        console.log('Databases:');
        res.rows.forEach(r => console.log(`- ${r.datname}`));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

main();
