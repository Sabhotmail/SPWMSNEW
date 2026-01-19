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
        console.log('📦 ข้อมูลจาก Database เดิม (siripro-stock)');

        // 1. UOMs
        console.log('\n\n📋 1. UOMs (หน่วยนับหลัก)');
        console.log('-'.repeat(50));
        const allUoms = await client.query(`SELECT * FROM uoms ORDER BY uomcode`);
        console.table(allUoms.rows);

        // 2. ProductUOMs - Top 20 for overview
        console.log('\n\n📋 2. PRODUCT UOMS (หน่วยนับย่อย/ความสัมพันธ์)');
        console.log('-'.repeat(50));
        const productUoms = await client.query(`
            SELECT productcode, uomcode, uomratio, status
            FROM productuoms 
            ORDER BY productcode, uomratio DESC
            LIMIT 20
        `);
        console.table(productUoms.rows);

    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error.message);
    } finally {
        await client.end();
    }
}

main();
