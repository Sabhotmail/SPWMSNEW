const { Client } = require('pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// ตั้งค่าการเชื่อมต่อ DB เก่า - อ่านจาก .env
const legacyConfig = {
    host: process.env.LEGACY_DB_HOST || '192.168.10.15',
    port: parseInt(process.env.LEGACY_DB_PORT) || 5432,
    database: process.env.LEGACY_DB_NAME || 'siripro-stock',
    user: process.env.LEGACY_DB_USER || 'postgres',
    password: process.env.LEGACY_DB_PASSWORD || 'S1r1Pr0',
};

const prisma = new PrismaClient();

// ตรวจสอบว่ามี --clean flag หรือไม่
const isClean = process.argv.includes('--clean');

async function migrateDocuments() {
    const legacy = new Client(legacyConfig);

    try {
        console.log('🚀 เริ่มกระบวนการ Migration เอกสาร (เฉพาะ APPROVED)...\n');

        // ถ้ามี --clean flag ให้ล้างเอกสารก่อน
        if (isClean) {
            console.log('🧹 กำลังล้างเอกสารในระบบใหม่...');
            await prisma.transactionDetail.deleteMany({});
            await prisma.transactionHeader.deleteMany({});
            await prisma.documentNumber.deleteMany({});
            console.log('   ✅ ล้างเอกสารเรียบร้อย!\n');
        }

        await legacy.connect();
        const start = Date.now();

        // ดึงเฉพาะเอกสารที่ APPROVED แล้ว
        console.log('📄 กำลังดึงข้อมูลเอกสารจากระบบเก่า...');
        const headersRes = await legacy.query(`
            SELECT * FROM transaction_headers 
            WHERE status = 'ACTIVE' 
            ORDER BY docno
        `);
        const headers = headersRes.rows;
        console.log(`   พบเอกสาร APPROVED: ${headers.length} รายการ\n`);

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (let i = 0; i < headers.length; i++) {
            const h = headers[i];
            const docNo = h.docno;

            try {
                // ตรวจสอบว่ามีอยู่แล้วหรือไม่
                const existing = await prisma.transactionHeader.findUnique({
                    where: { docNo: docNo }
                });

                if (existing) {
                    skipCount++;
                    continue;
                }

                // ดึง Details ของเอกสารนี้
                const detailsRes = await legacy.query(
                    'SELECT * FROM transaction_details WHERE docno = $1 ORDER BY id',
                    [docNo]
                );
                const details = detailsRes.rows;

                // ตรวจสอบว่า User มีอยู่หรือไม่
                const userId = h.createduserid || 'SYSTEM';
                let user = await prisma.user.findUnique({ where: { userId: userId } });
                if (!user) {
                    // ใช้ User แรกที่มี
                    user = await prisma.user.findFirst();
                }

                // สร้าง Header
                await prisma.transactionHeader.create({
                    data: {
                        docNo: docNo,
                        docTypeCode: h.doctypecode,
                        docDate: new Date(h.docdate),
                        postDate: new Date(h.postdate),
                        whCode: h.whcode,
                        locCode: h.loccode || null,
                        toWhCode: h.towhcode || null,
                        ref1: h.ref1 || null,
                        ref2: h.ref2 || null,
                        ref3: h.ref3 || null,
                        movementTypeCode: h.movementtypecode || null,
                        salesmanCode: h.salesmancode || null,
                        remark: h.remark || null,
                        docStatus: 'APPROVED', // บังคับเป็น APPROVED
                        docState: h.docstate || 'CLOSED',
                        createdBy: user.userId,
                        createdUserName: h.createdusername || null,
                        updatedUserName: h.updatedusername || null,
                        approvedBy: user.userId,
                        approvedAt: new Date(h.updated_at || h.created_at),
                        createdAt: new Date(h.created_at),
                        updatedAt: new Date(h.updated_at || h.created_at),
                        details: {
                            create: details.map((d, idx) => ({
                                lineNo: idx + 1,
                                productCode: d.productcode,
                                uomCode: d.uomcode || 'PCS',
                                uomQty: parseInt(d.uomqty) || 0,
                                uomRatio: parseInt(d.uomratio) || 1,
                                pieceQty: parseInt(d.pieceqty) || 0,
                                qty: parseInt(d.pieceqty) || 0,
                                whCode: d.whcode || h.whcode,
                                locCode: d.loccode || '',
                                movementTypeCode: d.movementtypecode || null,
                                mfgDate: d.mfgdate ? new Date(d.mfgdate) : null,
                                expDate: d.expdate ? new Date(d.expdate) : null,
                                recordType: d.recordtype || '0',
                                docState: d.docstate || 'CLOSED',
                                createdUserName: d.createdusername || null,
                                updatedUserName: d.updatedusername || null,
                                createdUserId: d.createduserid || null,
                                updatedUserId: d.updateduserid || null,
                            }))
                        }
                    }
                });

                successCount++;

                // แสดง Progress ทุก 100 รายการ
                if ((i + 1) % 100 === 0 || i === headers.length - 1) {
                    console.log(`   📝 ประมวลผล: ${i + 1}/${headers.length} (สำเร็จ: ${successCount}, ข้าม: ${skipCount}, ผิดพลาด: ${errorCount})`);
                }

            } catch (err) {
                errorCount++;
                // console.error(`   ❌ เอกสาร ${docNo}: ${err.message}`);
            }
        }

        // อัพเดท Running Number ให้ต่อจากเลขล่าสุด
        console.log('\n🔢 กำลังอัพเดท Running Number...');
        const docTypes = ['IN', 'OUT', 'TRN', 'ADJ'];
        for (const dtCode of docTypes) {
            // หาเลขล่าสุดในระบบใหม่
            const lastDoc = await prisma.transactionHeader.findFirst({
                where: { docTypeCode: dtCode },
                orderBy: { docNo: 'desc' }
            });

            if (lastDoc) {
                // แยกปีและเลขลำดับจาก docNo เช่น IN2026000123
                const match = lastDoc.docNo.match(/([A-Z]+)(\d{4})(\d+)/);
                if (match) {
                    const year = parseInt(match[2]);
                    const lastNum = parseInt(match[3]);

                    await prisma.documentNumber.upsert({
                        where: { docTypeCode_year: { docTypeCode: dtCode, year: year } },
                        update: { lastNumber: lastNum },
                        create: { docTypeCode: dtCode, year: year, lastNumber: lastNum }
                    });
                    console.log(`   ${dtCode}: ปี ${year} -> เลขล่าสุด ${lastNum}`);
                }
            }
        }

        console.log('\n==================================================');
        console.log('✅ Migration เอกสารสำเร็จ!');
        console.log(`   📄 สำเร็จ: ${successCount} รายการ`);
        console.log(`   ⏭️ ข้าม (มีอยู่แล้ว): ${skipCount} รายการ`);
        console.log(`   ❌ ผิดพลาด: ${errorCount} รายการ`);
        console.log(`   ⏱️ ใช้เวลา: ${((Date.now() - start) / 1000).toFixed(2)} วินาที`);
        console.log('==================================================');

    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error);
    } finally {
        await legacy.end();
        await prisma.$disconnect();
    }
}

migrateDocuments();
