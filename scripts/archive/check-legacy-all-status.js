const { Client } = require('pg');
require('dotenv').config();

const legacyConfig = {
    host: process.env.LEGACY_DB_HOST || '192.168.10.15',
    port: parseInt(process.env.LEGACY_DB_PORT) || 5432,
    database: process.env.LEGACY_DB_NAME || 'siripro-stock',
    user: process.env.LEGACY_DB_USER || 'postgres',
    password: process.env.LEGACY_DB_PASSWORD || 'S1r1Pr0',
};

const productCode = '1010010001';
const whCode = '42G1';

async function checkAllStatuses() {
    const legacy = new Client(legacyConfig);
    try {
        await legacy.connect();

        console.log(`--- Checking ALL Transactions for ${productCode} in ${whCode} ---\n`);

        // 1. Count by status
        const statusRes = await legacy.query(`
            SELECT th.status, COUNT(*) as count, SUM(td.pieceqty) as total_qty
            FROM transaction_details td
            JOIN transaction_headers th ON td.docno = th.docno
            WHERE td.productcode = $1
            AND td.whcode = $2
            AND th.docdate < '2025-01-01'
            GROUP BY th.status
            ORDER BY th.status
        `, [productCode, whCode]);

        console.log('[1] Transactions by Status:');
        statusRes.rows.forEach(r => {
            console.log(`  ${r.status}: ${r.count} records, Total Qty: ${r.total_qty} pieces`);
        });

        // 2. Count by docstate
        const stateRes = await legacy.query(`
            SELECT th.docstate, COUNT(*) as count, SUM(td.pieceqty) as total_qty
            FROM transaction_details td
            JOIN transaction_headers th ON td.docno = th.docno
            WHERE td.productcode = $1
            AND td.whcode = $2
            AND th.docdate < '2025-01-01'
            GROUP BY th.docstate
            ORDER BY th.docstate
        `, [productCode, whCode]);

        console.log('\n[2] Transactions by DocState:');
        stateRes.rows.forEach(r => {
            console.log(`  ${r.docstate}: ${r.count} records, Total Qty: ${r.total_qty} pieces`);
        });

        // 3. Sum for ACTIVE only vs ALL
        const sumActiveRes = await legacy.query(`
            SELECT SUM(td.pieceqty) as total
            FROM transaction_details td
            JOIN transaction_headers th ON td.docno = th.docno
            WHERE td.productcode = $1
            AND td.whcode = $2
            AND th.docdate < '2025-01-01'
            AND th.status = 'ACTIVE'
        `, [productCode, whCode]);

        const sumAllRes = await legacy.query(`
            SELECT SUM(td.pieceqty) as total
            FROM transaction_details td
            JOIN transaction_headers th ON td.docno = th.docno
            WHERE td.productcode = $1
            AND td.whcode = $2
            AND th.docdate < '2025-01-01'
        `, [productCode, whCode]);

        console.log('\n[3] Total pieceQty Comparison:');
        console.log(`  ACTIVE only: ${sumActiveRes.rows[0].total || 0} pieces`);
        console.log(`  ALL status:  ${sumAllRes.rows[0].total || 0} pieces`);

        // 4. Check if movementtypes affect calculation
        console.log('\n[4] Transactions by MovementType:');
        const movRes = await legacy.query(`
            SELECT td.movementtypecode, COUNT(*) as count, SUM(td.pieceqty) as total_qty
            FROM transaction_details td
            JOIN transaction_headers th ON td.docno = th.docno
            WHERE td.productcode = $1
            AND td.whcode = $2
            AND th.docdate < '2025-01-01'
            AND th.status = 'ACTIVE'
            GROUP BY td.movementtypecode
            ORDER BY td.movementtypecode
        `, [productCode, whCode]);

        movRes.rows.forEach(r => {
            console.log(`  ${r.movementtypecode}: ${r.count} records, Total: ${r.total_qty} pieces`);
        });

        // 5. Check movementtypes table for direction
        console.log('\n[5] MovementTypes Definition:');
        const mtRes = await legacy.query(`SELECT * FROM movementtypes ORDER BY movementtypecode`);
        mtRes.rows.forEach(r => {
            console.log(`  ${r.movementtypecode}: ${r.movementtypename} (stocksign: ${r.stocksign})`);
        });

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await legacy.end();
    }
}

checkAllStatuses();
