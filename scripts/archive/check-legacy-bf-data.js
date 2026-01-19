const { Client } = require('pg');
require('dotenv').config();

async function checkBFData() {
    const client = new Client({
        host: process.env.LEGACY_DB_HOST,
        port: process.env.LEGACY_DB_PORT,
        user: process.env.LEGACY_DB_USER,
        password: process.env.LEGACY_DB_PASSWORD,
        database: process.env.LEGACY_DB_NAME
    });

    await client.connect();

    const productCode = '1010010001';
    const whCode = '42G1';

    console.log(`Checking BF data for ${productCode} in ${whCode}...`);

    const res = await client.query(`
        SELECT * FROM vwbroughtforwardbalanceqty 
        WHERE productcode = $1 AND whcode = $2
        ORDER BY period DESC
    `, [productCode, whCode]);

    console.table(res.rows);

    await client.end();
}

checkBFData().catch(console.error);
