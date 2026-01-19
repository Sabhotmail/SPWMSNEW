// Script ดูตัวอย่างข้อมูลละเอียดจาก Database เดิม
const { Client } = require('pg');

const client = new Client({
    host: '192.168.10.15',
    port: 5432,
    database: 'siripro-stock',
    user: 'postgres',
    password: 'S1r1Pr0',
});

async function main() {
    try {
        await client.connect();
        console.log('='.repeat(80));
        console.log('📦 ตัวอย่างข้อมูลจาก Database เดิม (siripro-stock)');
        console.log('='.repeat(80));

        // 1. Products - ตัวอย่าง 5 รายการ
        console.log('\n\n📋 1. PRODUCTS (ตัวอย่าง 5 รายการ)');
        console.log('-'.repeat(80));
        const products = await client.query(`
            SELECT productcode, productname, principalcode, shelflife, status
            FROM products 
            LIMIT 5
        `);
        console.table(products.rows);

        // 2. ProductUOMs - ตัวอย่าง (ดูโครงสร้างก่อน)
        console.log('\n\n📋 2. PRODUCT UOMS (หน่วยนับหลาย ระดับ)');
        console.log('-'.repeat(80));
        const uoms = await client.query(`
            SELECT productcode, uomcode, uomratio, status
            FROM productuoms 
            WHERE productcode IN (SELECT productcode FROM products LIMIT 3)
            ORDER BY productcode, uomratio DESC
        `);
        console.table(uoms.rows);

        // 3. Warehouses
        console.log('\n\n📋 3. WAREHOUSES (คลังสินค้า)');
        console.log('-'.repeat(80));
        const warehouses = await client.query(`SELECT whcode, whname, status FROM warehouses`);
        console.table(warehouses.rows);

        // 4. Principals
        console.log('\n\n📋 4. PRINCIPALS (ผู้ผลิต)');
        console.log('-'.repeat(80));
        const principals = await client.query(`SELECT principalcode, principalname, status FROM principals`);
        console.table(principals.rows);

        // 5. UOMs
        console.log('\n\n📋 5. UOMs (หน่วยนับ)');
        console.log('-'.repeat(80));
        const allUoms = await client.query(`SELECT * FROM uoms`);
        console.table(allUoms.rows);

        // 6. MovementTypes
        console.log('\n\n📋 6. MOVEMENT TYPES (ประเภทการเคลื่อนไหว)');
        console.log('-'.repeat(80));
        const mvTypes = await client.query(`
            SELECT movementtypecode, movementtypename, stocksign, status 
            FROM movementtypes
            ORDER BY movementtypecode
        `);
        console.table(mvTypes.rows);

        // 7. Stocks - ตัวอย่าง
        console.log('\n\n📋 7. STOCKS (ยอดคงเหลือ - ตัวอย่าง 10 รายการที่มียอด)');
        console.log('-'.repeat(80));
        const stocks = await client.query(`
            SELECT productcode, whcode, balanceqty, reserved, status 
            FROM stocks 
            WHERE balanceqty > 0
            ORDER BY balanceqty DESC
            LIMIT 10
        `);
        console.table(stocks.rows);

        // 8. StockDates - ตัวอย่าง
        console.log('\n\n📋 8. STOCK DATES (แยกตาม MFG/EXP - ตัวอย่าง 10 รายการ)');
        console.log('-'.repeat(80));
        const stockDates = await client.query(`
            SELECT productcode, whcode, mfgdate, expdate, balanceqty, status 
            FROM stockdates 
            WHERE balanceqty > 0
            ORDER BY expdate ASC
            LIMIT 10
        `);
        console.table(stockDates.rows);

        // 9. Transaction Headers - ตัวอย่างล่าสุด
        console.log('\n\n📋 9. TRANSACTION HEADERS (เอกสารล่าสุด 10 รายการ)');
        console.log('-'.repeat(80));
        const txHeaders = await client.query(`
            SELECT docno, doctypecode, whcode, docdate, docstatus, createdusername
            FROM transaction_headers 
            ORDER BY docdate DESC, id DESC
            LIMIT 10
        `);
        console.table(txHeaders.rows);

        // 10. Users
        console.log('\n\n📋 10. USERS (ผู้ใช้งาน)');
        console.log('-'.repeat(80));
        const users = await client.query(`SELECT userid, username, role, status FROM users`);
        console.table(users.rows);

    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error.message);
    } finally {
        await client.end();
        console.log('\n\n🔌 ปิดการเชื่อมต่อแล้ว');
    }
}

main();
