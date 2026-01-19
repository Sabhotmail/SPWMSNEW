const { Client } = require('pg');
require('dotenv').config();

async function checkLegacyStock() {
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

    console.log(`🔎 ตรวจสอบตาราง stocks ในระบบเก่าสำหรับ ${productCode}...`);

    try {
        // ดูว่ามีคอลัมน์อะไรบ้าง
        const cols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'stocks'`);
        const colNames = cols.rows.map(r => r.column_name);
        console.log('Columns in stocks:', colNames);

        // ดึงข้อมูลออกมาดู
        const res = await client.query(`SELECT * FROM stocks WHERE productcode = $1 AND whcode = $2`, [productCode, whCode]);
        console.table(res.rows);

        // ลองเช็คยอดรวม Transaction ในระบบเก่าด้วย
        const transRes = await client.query(`
            SELECT SUM(CASE WHEN h.whcode = $2 THEN -d.pieceqty ELSE d.pieceqty END) as legacy_sum
            FROM transaction_headers h
            JOIN transaction_details d ON h.docno = d.docno
            WHERE d.productcode = $1 AND h.docdate < '2025-01-01' AND h.status = 'ACTIVE'
        `, [productCode, whCode]);
        console.log('\n📊 ผลรวม Transaction ในระบบเก่า (ก่อนปี 2025):', transRes.rows[0].legacy_sum);

    } catch (e) {
        console.error('❌ Error:', e.message);
    }

    await client.end();
}

checkLegacyStock().catch(console.error);
