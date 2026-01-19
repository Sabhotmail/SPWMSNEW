const { Client } = require('pg');
require('dotenv').config();

async function checkLegacyTables() {
    const client = new Client({
        host: process.env.LEGACY_DB_HOST,
        port: process.env.LEGACY_DB_PORT,
        user: process.env.LEGACY_DB_USER,
        password: process.env.LEGACY_DB_PASSWORD,
        database: process.env.LEGACY_DB_NAME
    });

    await client.connect();

    // เช็คว่ามีตารางที่เกี่ยวกับ Stock หรือ Opening Balance ไหม
    const res = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%stock%' OR table_name LIKE '%balance%' OR table_name LIKE '%opening%'
    `);

    console.log('Legacy Tables related to Stock/Balance:');
    res.rows.forEach(row => console.log(`- ${row.table_name}`));

    // เช็คข้อมูลใน mas_doc_type เพื่อดูว่ามีรหัสอะไรที่เกี่ยวกับยอดเริ่มต้นไหม
    try {
        const docTypes = await client.query("SELECT doc_type_code, doc_type_name, movement_type FROM mas_doc_type");
        console.log('\nLegacy Document Types:');
        console.table(docTypes.rows);
    } catch (e) {
        console.log('\nCould not find mas_doc_type table');
    }

    await client.end();
}

checkLegacyTables().catch(console.error);
