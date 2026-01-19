import { Client } from 'pg';

async function main() {
    const client = new Client({
        user: 'postgres', host: '127.0.0.1', password: 'S1r1Pr0', port: 5432,
        database: 'siripro-stock'
    });

    try {
        await client.connect();
        const res = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
        console.log('Tables in public schema of siripro-stock:');
        for (const row of res.rows) {
            const countRes = await client.query(`SELECT COUNT(*) FROM "${row.tablename}"`);
            console.log(`- ${row.tablename}: ${countRes.rows[0].count}`);
        }
    } catch (err) {
    } finally {
        await client.end();
    }
}

main();
