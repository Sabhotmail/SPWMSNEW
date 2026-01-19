const { Client } = require('pg');
require('dotenv').config();

const legacyConfig = {
    host: process.env.LEGACY_DB_HOST,
    port: parseInt(process.env.LEGACY_DB_PORT),
    database: process.env.LEGACY_DB_NAME,
    user: process.env.LEGACY_DB_USER,
    password: process.env.LEGACY_DB_PASSWORD,
};

async function checkProducts() {
    const legacy = new Client(legacyConfig);
    try {
        await legacy.connect();
        const res = await legacy.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'products'
        `);
        console.log('Columns:', res.rows.map(r => r.column_name).join(', '));

        const sample = await legacy.query(`SELECT * FROM products LIMIT 1`);
        console.log('Sample Row:', sample.rows[0]);
    } catch (err) {
        console.error(err);
    } finally {
        await legacy.end();
    }
}

checkProducts();
