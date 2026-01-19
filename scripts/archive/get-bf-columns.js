const { Client } = require('pg');
require('dotenv').config();

async function getColumns() {
    const client = new Client({
        host: process.env.LEGACY_DB_HOST,
        port: process.env.LEGACY_DB_PORT,
        user: process.env.LEGACY_DB_USER,
        password: process.env.LEGACY_DB_PASSWORD,
        database: process.env.LEGACY_DB_NAME
    });

    await client.connect();

    const res = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'vwbroughtforwardbalanceqty'
    `);

    console.log('Columns in vwbroughtforwardbalanceqty:');
    console.log(res.rows.map(r => r.column_name));

    await client.end();
}

getColumns().catch(console.error);
