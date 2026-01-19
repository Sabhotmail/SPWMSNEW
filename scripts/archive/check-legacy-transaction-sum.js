const { Client } = require('pg');
require('dotenv').config();

async function checkLegacySum() {
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

    console.log(`🔎 Calculating transaction sum in legacy for ${productCode} in ${whCode} until end of 2024...`);

    // We need to be careful with how we sum. 
    // Usually: IN/ADJ/BEG to this WH is +, OUT/TRN from this WH is -
    // TRN to this WH is +

    const res = await client.query(`
        SELECT 
            h.docno, h.docdate, h.doctypecode, d.pieceqty, h.whcode, h.towhcode
        FROM transaction_headers h
        JOIN transaction_details d ON h.docno = d.docno
        WHERE d.productcode = $1 
        AND h.docdate <= '2024-12-31'
        AND h.status = 'ACTIVE'
        ORDER BY h.docdate ASC, h.docno ASC
    `, [productCode]);

    let balance = 0;
    console.log('DOC_NO | DATE | TYPE | WH | TO_WH | QTY | RUNNING');
    res.rows.forEach(r => {
        const qty = Number(r.pieceqty);
        let delta = 0;

        if (r.doctypecode === 'TRN') {
            if (r.whcode === whCode) delta -= qty;
            if (r.towhcode === whCode) delta += qty;
        } else {
            // Check if it's an IN or OUT type. 
            // In legacy, we might need to check mas_doc_type but let's guess from code
            const isOut = ['OUT', 'ADJ', 'TRN'].includes(r.doctypecode); // Based on migrate-full.js logic

            if (r.towhcode === whCode) {
                delta += qty;
            } else if (r.whcode === whCode) {
                delta += (isOut ? -qty : qty);
            }
        }

        balance += delta;
        if (delta !== 0) {
            console.log(`${r.docno.padEnd(12)} | ${r.docdate.toISOString().split('T')[0]} | ${r.doctypecode.padEnd(4)} | ${r.whcode} | ${r.towhcode} | ${qty.toString().padStart(6)} | ${balance.toString().padStart(8)}`);
        }
    });

    console.log('\n------------------------------------------------');
    console.log(`Legacy Total Balance at end of 2024: ${balance} (${balance / 72} cartons)`);

    // Check vwbroughtforwardbalanceqty again for comparison
    const bf = await client.query(`SELECT bfqty FROM vwbroughtforwardbalanceqty WHERE productcode = $1 AND whcode = $2 AND period = '2024-12-31 17:00:00'`, [productCode, whCode]);
    console.log(`Legacy vwbroughtforwardbalanceqty at 2024-12-31: ${bf.rows[0]?.bfqty || 'N/A'}`);

    await client.end();
}

checkLegacySum().catch(console.error);
