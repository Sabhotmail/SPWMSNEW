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

async function checkLegacy() {
    const legacy = new Client(legacyConfig);
    try {
        await legacy.connect();

        console.log(`--- Checking Legacy DB for ${productCode} in ${whCode} ---`);

        // 1. Check current balance from stocks table
        const stockRes = await legacy.query(`
            SELECT * FROM stocks 
            WHERE productcode = $1
            AND whcode = $2
        `, [productCode, whCode]);

        console.log('\n[1] Current Stock Balance in Legacy (Stocks Table):');
        if (stockRes.rows.length === 0) {
            console.log('No stock record found.');
        } else {
            stockRes.rows.forEach(r => {
                console.log(`Balance: ${r.balance} pieces (${Number(r.balance) / 72} cartons)`);
            });
        }

        // 2. Sum transactions in legacy (Up to end of 2024)
        // Note: In legacy, documenttypes mapping might be needed for IN/OUT
        const transRes = await legacy.query(`
            SELECT 
                td.docno, td.pieceqty, th.doctypecode, th.docdate, td.recordtype, th.whcode as header_wh, th.towhcode
            FROM transaction_details td
            JOIN transaction_headers th ON td.docno = th.docno
            WHERE td.productcode = $1
            AND td.whcode = $2
            AND th.docdate < '2025-01-01'
            AND th.status = 'ACTIVE'
            ORDER BY th.docdate ASC, td.docno ASC
        `, [productCode, whCode]);

        console.log('\n[2] Transaction Sum Calculation in Legacy (Before 2025):');
        let calculatedBalance = 0;

        // Manual mapping based on migrate-full.js logic
        const getMovementType = (code) => {
            if (['IN', 'RCV', 'BEG', 'RTN', 'INS'].includes(code)) return 'IN';
            if (['OUT', 'ISS', 'SHP'].includes(code)) return 'OUT';
            return 'IN'; // Default like in migrate-full.js for TRN/ADJ context
        };

        transRes.rows.forEach(r => {
            const qty = Number(r.pieceqty);
            let change = 0;
            const docType = r.doctypecode;

            if (docType === 'TRN') {
                if (r.recordtype === '1') change = -qty;
                else if (r.recordtype === '2') change = qty;
            } else {
                const movType = getMovementType(docType);
                change = (movType === 'IN') ? qty : -qty;
            }
            calculatedBalance += change;
            // console.log(`${r.docdate.toISOString().split('T')[0]} | ${r.docno} | ${docType} | ${change} | ${calculatedBalance}`);
        });

        console.log(`Sum of Transactions: ${calculatedBalance} pieces (${calculatedBalance / 72} cartons)`);

        // 3. Check if there's any "Opening Balance" or "Brought Forward" logic in legacy
        // Some systems use a specific doc type or a seed record.
        const begRes = await legacy.query(`
            SELECT SUM(td.pieceqty) as total
            FROM transaction_details td
            JOIN transaction_headers th ON td.docno = th.docno
            WHERE td.productcode = $1
            AND td.whcode = $2
            AND th.doctypecode = 'BEG'
            AND th.status = 'ACTIVE'
        `, [productCode, whCode]);

        console.log(`\n[3] Total 'BEG' Transactions in Legacy: ${begRes.rows[0].total || 0} pieces`);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await legacy.end();
    }
}

checkLegacy();
