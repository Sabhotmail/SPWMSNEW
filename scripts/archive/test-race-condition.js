const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * สคริปต์ทดสอบการอนุมัติซ้ำ (Race Condition Test)
 * เพื่อตรวจสอบว่าถ้ายิงคำสั่งพร้อมกันสองครั้ง ระบบจะเบิ้ลสต็อกหรือไม่
 */
async function testConcurrentApproval() {
    console.log('🚀 เริ่มการทดสอบ Race Condition (Double Approval)...');

    const QTY = 10;

    try {
        // 1. ดึงสินค้า, คลัง และ User ที่มีอยู่แล้วใน DB
        const existingProduct = await prisma.product.findFirst({ where: { status: 'ACTIVE' } });
        const existingWarehouse = await prisma.warehouse.findFirst({ where: { status: 'ACTIVE' } });
        const existingUser = await prisma.user.findFirst({ where: { status: 'ACTIVE' } });

        if (!existingProduct) {
            console.error('❌ ไม่พบสินค้าใน Database กรุณาสร้างสินค้าก่อน');
            return;
        }
        if (!existingWarehouse) {
            console.error('❌ ไม่พบคลังสินค้าใน Database กรุณาสร้างคลังก่อน');
            return;
        }
        if (!existingUser) {
            console.error('❌ ไม่พบ User ใน Database กรุณาสร้าง User ก่อน');
            return;
        }

        const PRODUCT_CODE = existingProduct.productCode;
        const WH_CODE = existingWarehouse.whCode;
        const USER_ID = existingUser.userId;
        console.log(`📦 ใช้สินค้าทดสอบ: ${PRODUCT_CODE} (${existingProduct.productName})`);
        console.log(`🏭 ใช้คลังทดสอบ: ${WH_CODE} (${existingWarehouse.whName})`);
        console.log(`👤 ใช้ User ทดสอบ: ${USER_ID}`);

        // รีเซ็ตสต็อกเป็น 0 ก่อนทดสอบ
        await prisma.stock.upsert({
            where: { productCode_whCode_locCode: { productCode: PRODUCT_CODE, whCode: WH_CODE, locCode: '' } },
            update: { qty: 0, balance: 0, futureInBal: 0, futureOutBal: 0 },
            create: { productCode: PRODUCT_CODE, whCode: WH_CODE, locCode: '', qty: 0, balance: 0, futureInBal: 0, futureOutBal: 0 }
        });

        // 2. สร้างบิล DRAFT สำหรับทดสอบ
        const now = new Date();
        const tx = await prisma.transactionHeader.create({
            data: {
                docNo: 'TX-TEST-' + Date.now(),
                docTypeCode: 'IN', // รับเข้า
                docDate: now,
                postDate: now,
                docStatus: 'DRAFT',
                docState: 'OPEN',
                whCode: WH_CODE,
                createdBy: USER_ID,
                details: {
                    create: {
                        lineNo: 1,
                        productCode: PRODUCT_CODE,
                        whCode: WH_CODE,
                        qty: QTY,
                        pieceQty: QTY,
                        uomCode: 'PCS'
                    }
                }
            },
            include: { details: true }
        });

        // ฟังก์ชันจำลองการเขียน Log ลอกมาจาก src/lib/logging.ts
        const writeLogs = async (txPrisma, docNo, pieceQty, oldBal, newBal, isApprove = true) => {
            // 1. บันทึก Stock Log
            await txPrisma.stockLog.create({
                data: {
                    functionName: isApprove ? 'APPROVE_IN' : 'FUTURE_IN',
                    docNo: docNo,
                    productCode: PRODUCT_CODE,
                    whCode: WH_CODE,
                    balanceOld: oldBal,
                    futureInBalOld: 0,
                    futureOutBalOld: 0,
                    pieceQty: pieceQty,
                    balanceNew: newBal,
                    futureInBalNew: 0,
                    futureOutBalNew: 0,
                    createdUserId: USER_ID,
                    updatedUserId: USER_ID,
                }
            });

            // 2. บันทึก Activity Log
            if (isApprove) {
                await txPrisma.activityLog.create({
                    data: {
                        userId: USER_ID,
                        username: existingUser.username,
                        action: 'APPROVE',
                        module: 'TRANSACTION',
                        docNo: docNo,
                        description: `[TEST] อนุมัติเอกสาร ${docNo} (รับเข้า)`,
                    }
                });
            }
        };

        // ========== ตอนสร้างบิล DRAFT: เขียน Log จองสินค้า ==========
        await prisma.$transaction(async (txPrisma) => {
            await writeLogs(txPrisma, tx.docNo, QTY, 0, 0, false);
        });

        // ========== ทดสอบแบบเก่า (มีปัญหา Race Condition) ==========
        console.log(`\n🔴 ทดสอบ Logic แบบเก่า (เช็ค DRAFT นอก Transaction)...`);

        // รีเซ็ตสต็อกและบิลก่อนทดสอบ
        await prisma.stock.update({
            where: { productCode_whCode_locCode: { productCode: PRODUCT_CODE, whCode: WH_CODE, locCode: '' } },
            data: { qty: 0, balance: 0 }
        });
        await prisma.transactionHeader.update({
            where: { id: tx.id },
            data: { docStatus: 'DRAFT' }
        });

        const approveLogicOld = async (requestNo) => {
            const start = Date.now();
            try {
                const currentTx = await prisma.transactionHeader.findUnique({
                    where: { id: tx.id }
                });

                if (currentTx.docStatus !== 'DRAFT') {
                    return { requestNo, status: 'REJECTED', reason: 'Not DRAFT', time: Date.now() - start };
                }

                await new Promise(r => setTimeout(r, 50));

                await prisma.$transaction(async (txPrisma) => {
                    await txPrisma.transactionHeader.update({
                        where: { id: tx.id },
                        data: { docStatus: 'APPROVED' }
                    });

                    const s = await txPrisma.stock.findUnique({
                        where: { productCode_whCode_locCode: { productCode: PRODUCT_CODE, whCode: WH_CODE, locCode: '' } }
                    });

                    await txPrisma.stock.update({
                        where: { productCode_whCode_locCode: { productCode: PRODUCT_CODE, whCode: WH_CODE, locCode: '' } },
                        data: { qty: { increment: QTY }, balance: { increment: QTY } }
                    });

                    // เขียน Log
                    await writeLogs(txPrisma, tx.docNo, QTY, s.balance, s.balance + QTY, true);
                });

                return { requestNo, status: 'SUCCESS', time: Date.now() - start };
            } catch (err) {
                return { requestNo, status: 'ERROR', message: err.message, time: Date.now() - start };
            }
        };

        const oldResults = await Promise.all([
            approveLogicOld(1),
            approveLogicOld(2),
            approveLogicOld(3)
        ]);

        console.log('ผลลัพธ์แบบเก่า:');
        console.table(oldResults);

        const stockAfterOld = await prisma.stock.findUnique({
            where: { productCode_whCode_locCode: { productCode: PRODUCT_CODE, whCode: WH_CODE, locCode: '' } }
        });
        console.log(`สต็อกหลังทดสอบแบบเก่า: ${stockAfterOld.qty} (ควรเป็น ${QTY})`);
        const oldHasBug = stockAfterOld.qty > QTY;

        // ========== ทดสอบแบบใหม่ (ใช้ FOR UPDATE Locking) ==========
        console.log(`\n🟢 ทดสอบ Logic แบบใหม่ (ใช้ FOR UPDATE Lock)...`);

        // รีเซ็ตสต็อกและบิลก่อนทดสอบ
        await prisma.stock.update({
            where: { productCode_whCode_locCode: { productCode: PRODUCT_CODE, whCode: WH_CODE, locCode: '' } },
            data: { qty: 0, balance: 0 }
        });
        await prisma.transactionHeader.update({
            where: { id: tx.id },
            data: { docStatus: 'DRAFT' }
        });

        // จำลอง Logic ที่แก้ไขแล้ว (ใช้ FOR UPDATE lock)
        const approveLogicFixed = async (requestNo) => {
            const start = Date.now();
            try {
                await prisma.$transaction(async (txPrisma) => {
                    const lockedTx = await txPrisma.$queryRaw`
                        SELECT id, doc_status FROM transaction_headers 
                        WHERE id = ${tx.id} 
                        FOR UPDATE
                    `;

                    if (!lockedTx || lockedTx.length === 0) throw new Error('Transaction not found');
                    if (lockedTx[0].doc_status !== 'DRAFT') throw new Error('Already approved');

                    await txPrisma.transactionHeader.update({
                        where: { id: tx.id },
                        data: { docStatus: 'APPROVED' }
                    });

                    const s = await txPrisma.stock.findUnique({
                        where: { productCode_whCode_locCode: { productCode: PRODUCT_CODE, whCode: WH_CODE, locCode: '' } }
                    });

                    await txPrisma.stock.update({
                        where: { productCode_whCode_locCode: { productCode: PRODUCT_CODE, whCode: WH_CODE, locCode: '' } },
                        data: { qty: { increment: QTY }, balance: { increment: QTY } }
                    });

                    // เขียน Log
                    await writeLogs(txPrisma, tx.docNo, QTY, s.balance, s.balance + QTY, true);
                });

                return { requestNo, status: 'SUCCESS', time: Date.now() - start };
            } catch (err) {
                return { requestNo, status: 'BLOCKED', message: err.message, time: Date.now() - start };
            }
        };

        const fixedResults = await Promise.all([
            approveLogicFixed(1),
            approveLogicFixed(2),
            approveLogicFixed(3)
        ]);

        console.log('ผลลัพธ์แบบใหม่:');
        console.table(fixedResults);

        const stockAfterFixed = await prisma.stock.findUnique({
            where: { productCode_whCode_locCode: { productCode: PRODUCT_CODE, whCode: WH_CODE, locCode: '' } }
        });
        console.log(`สต็อกหลังทดสอบแบบใหม่: ${stockAfterFixed.qty} (ควรเป็น ${QTY})`);
        const fixedHasBug = stockAfterFixed.qty > QTY;

        // ========== สรุปผล ==========
        console.log(`\n==================================================`);
        console.log(`📊 สรุปผลการทดสอบ:`);
        console.log(`--------------------------------------------------`);
        console.log(`Logic แบบเก่า: ${oldHasBug ? '❌ มีปัญหา Race Condition (สตรีมมิ่ง Log จะซ้อนกัน)' : '✅ ปกติ'}`);
        console.log(`Logic แบบใหม่: ${fixedHasBug ? '❌ ยังมีปัญหา' : '✅ ป้องกันได้แล้ว (Log จะมีรายการเดียว)'}`);
        console.log(`==================================================`);

    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการทดสอบ:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testConcurrentApproval();
