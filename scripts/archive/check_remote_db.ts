import { Client } from 'pg';

async function main() {
    const client = new Client({
        user: 'postgres',
        host: '192.168.10.15',
        password: 'S1r1Pr0',
        port: 5432,
        database: 'siripro-stock',
        connectionTimeoutMillis: 5000,
    });

    try {
        await client.connect();
        console.log('Connected to remote database at 192.168.10.15');

        const res = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `);

        console.log('Tables and Row Counts:');
        for (const row of res.rows) {
            const countRes = await client.query(`SELECT COUNT(*) FROM "${row.tablename}"`);
            const count = countRes.rows[0].count;
            console.log(`- ${row.tablename}: ${count} rows`);
        }

    } catch (err) {
        console.error('Error connecting to remote database:', err);
    } finally {
        await client.end();
    }
}

main();
