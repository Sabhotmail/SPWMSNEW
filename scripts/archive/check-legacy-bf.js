const { Client } = require('pg');
require('dotenv').config();

async function checkBroughtForward() {
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

    console.log(`Checking vwbroughtforwardbalanceqty for ${productCode} in ${whCode}...`);

    try {
        const res = await client.query(`
            SELECT * FROM vwbroughtforwardbalanceqty 
            WHERE product_code = $1 AND wh_code = $2
        `, [productCode, whCode]);

        console.table(res.rows);
    } catch (e) {
        console.error('Error querying vwbroughtforwardbalanceqty:', e.message);
    }

    await client.end();
}

checkBroughtForward().catch(console.error);
