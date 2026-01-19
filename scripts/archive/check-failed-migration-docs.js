const { Client } = require('pg');
require('dotenv').config();

async function checkFailedDocs() {
    const client = new Client({
        host: process.env.LEGACY_DB_HOST,
        port: process.env.LEGACY_DB_PORT,
        user: process.env.LEGACY_DB_USER,
        password: process.env.LEGACY_DB_PASSWORD,
        database: process.env.LEGACY_DB_NAME
    });

    await client.connect();

    const failedDocNos = ['ADJ23000044', 'INS23000399', 'INS24001187', 'INS24001188', 'INS24001189'];
    const productCode = '1010010001';

    console.log(`🔎 Checking quantity in legacy DB for product ${productCode} in failed migration documents...`);

    for (const docNo of failedDocNos) {
        try {
            const res = await client.query(`
                SELECT h.docno, h.docdate, h.doctypecode, d.productcode, d.pieceqty, h.whcode, h.towhcode
                FROM transaction_headers h
                JOIN transaction_details d ON h.docno = d.docno
                WHERE h.docno = $1 AND d.productcode = $2
            `, [docNo, productCode]);

            if (res.rows.length > 0) {
                res.rows.forEach(row => {
                    console.log(`✅ Found: ${row.docno} | Date: ${row.docdate} | Type: ${row.doctypecode} | WH: ${row.whcode} | ToWH: ${row.towhcode} | Qty: ${row.pieceqty}`);
                });
            } else {
                console.log(`❌ Not found in legacy (or product not in doc): ${docNo}`);
            }
        } catch (err) {
            console.error(`❌ Error querying ${docNo}:`, err.message);
        }
    }

    await client.end();
}

checkFailedDocs().catch(console.error);
