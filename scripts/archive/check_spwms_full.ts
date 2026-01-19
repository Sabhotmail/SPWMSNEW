import { Client } from 'pg';

async function main() {
    const client = new Client({
        user: 'postgres', host: '127.0.0.1', password: 'S1r1Pr0', port: 5432,
        database: 'spwms_new'
    });

    try {
        await client.connect();
        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

        console.log('Tables in spwms_new:');
        for (const row of res.rows) {
            const countRes = await client.query(`SELECT COUNT(*) FROM "${row.table_name}"`);
            console.log(`- ${row.table_name}: ${countRes.rows[0].count}`);
        }
    } catch (err) {
    } finally {
        await client.end();
    }
}

main();
