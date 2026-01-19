const { Client } = require('pg');
require('dotenv').config();

async function checkBF() {
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

    console.log(`🔎 ตรวจสอบว่ายอด 60 ลัง (4,320 ชิ้น) มาจากไหน...`);

    // 1. ดูยอด BF ณ สิ้นปี 2023
    const bfRes = await client.query(`
        SELECT * FROM vwbroughtforwardbalanceqty 
        WHERE productcode = $1 AND whcode = $2 AND period = '2023-12-31 17:00:00'
    `, [productCode, whCode]);

    if (bfRes.rows.length > 0) {
        console.log('ยอด BF สิ้นปี 2023 (สำหรับเริ่มปี 2024):', bfRes.rows[0].bfqty);
    } else {
        console.log('ไม่พบยอด BF สิ้นปี 2023');
    }

    // 2. ลองหา Transaction ในปี 2024 ทั้งหมดในที่เดียว
    const trans2024 = await client.query(`
        SELECT SUM(CASE 
            WHEN h.doc_type_code IN ('OUT', 'TRN') AND h.whcode = $2 THEN -d.pieceqty
            WHEN h.doc_type_code IN ('IN', 'ADJ', 'BEG') AND h.to_whcode = $2 THEN d.pieceqty
            WHEN h.doc_type_code IN ('TRN') AND h.to_whcode = $2 THEN d.pieceqty
            ELSE 0 
        END) as net_2024
        FROM transaction_headers h
        JOIN transaction_details d ON h.docno = d.docno
        WHERE d.productcode = $1 
        AND h.docdate >= '2024-01-01' AND h.docdate <= '2024-12-31'
        AND h.status = 'ACTIVE'
    `, [productCode, whCode]);

    console.log('ยอดเคลื่อนไหวสุทธิในปี 2024:', trans2024.rows[0].net_2024);

    await client.end();
}

checkBF().catch(console.error);
