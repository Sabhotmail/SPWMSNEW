// อัพเดท principalCode ตาม pattern รหัสสินค้า
// 001=SNNP (เจเล่, โสม, สิงห์), 002=KM, 005=SINO, 011=BRT (มาชิตะ), 012=THE (เต่าเหยียบโลก), 013=UBS
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// กำหนด mapping ตาม prefix
const prefixMapping = {
    '101': '001', // SNNP - เจเล่, สกินแล็บ
    '102': '001', // SNNP - เบบี้ไบร์ท  
    '103': '001', // SNNP
    '104': '001', // SNNP
    '105': '005', // SINO - ฟูลโล, ยูปี้
    '106': '005', // SINO
    '107': '005', // SINO
    '108': '001', // SNNP - โสม
    '109': '001', // SNNP
    '110': '001', // SNNP - ไฮเชฟ
    '111': '011', // BRT - มาชิตะ
    '112': '012', // THE - เต่าเหยียบโลก
    '113': '012', // THE - ทาสุโกะ
    '114': '012', // THE - ยกซด
    '115': '012', // THE - กัปตันเรือ
    '116': '012', // THE - ไลโอ
    '117': '010', // AMS - จิวะเฮิร์บ
    '118': '010', // AMS - เมิร์ฟ
    '119': '010', // AMS - ลูกเผ็ด
    '120': '008', // CSB - เป๊ปเปอรมิ้นฟิลด์
    '121': '008', // CSB - ดรีมมี่
    '122': '008', // CSB - คารามูโจ้
    '123': '013', // UBS - CWN
    '124': '013', // UBS - พรีราน่า
    '401': '001', // SNNP - พรีเมียม
    '403': '001', // SNNP
    '404': '001', // SNNP
    '408': '001', // SNNP
    '422': '001', // SNNP
};

async function updatePrincipals() {
    console.log('🔄 กำลังอัพเดท principalCode...\n');

    let totalUpdated = 0;
    const stats = {};

    for (const [prefix, principalCode] of Object.entries(prefixMapping)) {
        const result = await prisma.product.updateMany({
            where: {
                productCode: { startsWith: prefix },
                principalCode: null, // เฉพาะที่ยังไม่มี
            },
            data: { principalCode }
        });

        if (result.count > 0) {
            stats[prefix] = { count: result.count, principal: principalCode };
            totalUpdated += result.count;
            console.log(`  ${prefix}xxx → ${principalCode}: ${result.count} รายการ`);
        }
    }

    console.log('\n' + '='.repeat(40));
    console.log(`✅ อัพเดทสำเร็จ ${totalUpdated} รายการ`);

    await prisma.$disconnect();
}

updatePrincipals();
