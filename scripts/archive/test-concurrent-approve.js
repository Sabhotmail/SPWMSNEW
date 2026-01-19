const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRaceCondition() {
    console.log('--- เริ่มการทดสอบ Race Condition (ดับเบิ้ลอนุมัติ) ---');

    // 1. เตรียมข้อมูลทดสอบ
    const productCode = '1010010001'; // สินค้าทดสอบ
    const whCode = 'WH01';

    // ล้างสต็อกเก่าให้เป็น 0 ก่อนทดสอบ
    await prisma.stock.upsert({
        where: { productCode_whCode_locCode: { productCode, whCode, locCode: '' } },
        update: { qty: 0, balance: 0, futureInBal: 10 },
        create: { productCode, whCode, locCode: '', qty: 0, balance: 0, futureInBal: 10 }
    });

    // สร้าง Transaction DRAFT ทดสอบ
    const tx = await prisma.transactionHeader.create({
        data: {
            docNo: 'TEST-RACE-' + Date.now(),
            docTypeCode: 'IN',
            docStatus: 'DRAFT',
            docState: 'OPEN',
            whCode: whCode,
            createdBy: 'TEST-BOT',
            details: {
                create: {
                    lineNo: 1,
                    productCode: productCode,
                    whCode: whCode,
                    uomCode: 'PCS',
                    qty: 10,
                    pieceQty: 10
                }
            }
        }
    });

    console.log(`สร้างบิลทดสอบสำเร็จ: ${tx.docNo} (รับเข้า 10 ชิ้น)`);
    console.log('ยิงคำสั่ง Approve พร้อมกัน 5 ครั้ง...');

    // 2. จำลองการกดยิงพร้อมกัน (Simulate Concurrent Requests)
    // เราจะใช้ความเร็วของ Promise.all ยิงเข้าไปในระดับมิลลิวินาที
    const approveLogic = async (id) => {
        try {
            // จำลอง Logic ใน API
            return await prisma.$transaction(async (txPrisma) => {
                // ดึงข้อมูลบิล
                const currentTx = await txPrisma.transactionHeader.findUnique({
                    where: { id }
                });

                // ตรวจสอบสถานะ (จุดเสี่ยง ถ้าไม่ได้ทำ locking)
                if (currentTx.docStatus !== 'DRAFT') {
                    throw new Error('บิลถูกอนุมัติไปแล้ว');
                }

                // หน่วงเวลาเล็กน้อยเพื่อให้เห็น Race Condition ชัดขึ้น (เหมือนเวลา Database ทำงานหนัก)
                await new Promise(resolve => setTimeout(resolve, 100));

                // อัปเดตสถานะ
                await txPrisma.transactionHeader.update({
                    where: { id },
                    data: { docStatus: 'APPROVED' }
                });

                // บวกสต็อก
                await txPrisma.stock.update({
                    where: { productCode_whCode_locCode: { productCode, whCode, locCode: '' } },
                    data: {
                        qty: { increment: 10 },
                        futureInBal: { decrement: 10 }
                    }
                });

                return 'SUCCESS';
            });
        } catch (err) {
            return 'FAILED: ' + err.message;
        }
    };

    const results = await Promise.all([
        approveLogic(tx.id),
        approveLogic(tx.id),
        approveLogic(tx.id),
        approveLogic(tx.id),
        approveLogic(tx.id)
    ]);

    // 3. สรุปผล
    console.log('ผลลัพธ์คำสั่ง:', results);

    const finalStock = await prisma.stock.findUnique({
        where: { productCode_whCode_locCode: { productCode, whCode, locCode: '' } }
    });

    console.log('------------------------------------');
    console.log(`สต็อกเริ่มต้น: 0`);
    console.log(`บิลใบเดียวรับเข้า: 10`);
    console.log(`สต็อกสุดท้ายใน DB: ${finalStock.qty}`);

    if (finalStock.qty > 10) {
        console.error('❌ ล้มเหลว! เกิดการบันทึกซ้ำ (Stock Double Counted)');
    } else {
        console.log('✅ สำเร็จ! ระบบป้องกันแม่นยำ สต็อกไม่เบิ้ล');
    }
}

testRaceCondition()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
