const { Client } = require('pg');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
require('dotenv').config();

// 1. ตั้งค่าการเชื่อมต่อ DB เก่า (Source) - อ่านจาก .env
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

// สร้างไฟล์ log สำหรับเก็บ error
const logFile = 'migration-errors.log';
const errorLogs = [];

async function migrate() {
    const legacy = new Client(legacyConfig);

    try {
        console.log('🚀 เริ่มกระบวนการ Migration ข้อมูลแบบสมบูรณ์...');

        // ถ้ามี --clean flag ให้ล้างข้อมูลก่อน
        if (isClean) {
            console.log('🧹 กำลังล้างข้อมูลในระบบใหม่...');

            // ลบตามลำดับ Foreign Key (ลบตารางลูกก่อน)
            await prisma.stockLog.deleteMany({});
            await prisma.activityLog.deleteMany({});
            await prisma.transactionDetail.deleteMany({});
            await prisma.transactionHeader.deleteMany({});
            await prisma.stockDate.deleteMany({});
            await prisma.stock.deleteMany({});
            await prisma.documentNumber.deleteMany({});
            await prisma.productUOM.deleteMany({});
            await prisma.product.deleteMany({});
            await prisma.location.deleteMany({});
            await prisma.warehouse.deleteMany({});
            await prisma.uOM.deleteMany({});
            await prisma.brand.deleteMany({});
            await prisma.principal.deleteMany({});
            await prisma.documentType.deleteMany({});
            await prisma.movementType.deleteMany({});
            await prisma.user.deleteMany({});
            await prisma.branch.deleteMany({});
            await prisma.basket.deleteMany({});

            console.log('   ✅ ล้างข้อมูลเรียบร้อย!\n');
        }

        await legacy.connect();
        const start = Date.now();

        // ฟังก์ชันช่วยดึงข้อมูลจาก DB เก่า
        const getLegacyData = async (table) => {
            const res = await legacy.query(`SELECT * FROM ${table}`);
            return res.rows;
        };

        // --- 1. ย้าย Master Data พื้นฐาน ---
        console.log('📦 1/13 ย้ายข้อมูล Branches...');
        const branches = await getLegacyData('branches');
        for (const b of branches) {
            await prisma.branch.upsert({
                where: { branchCode: b.branch_code || b.branchcode },
                update: {},
                create: {
                    branchCode: b.branch_code || b.branchcode,
                    branchName: b.branch_name || b.branchname,
                    status: b.status || 'ACTIVE'
                }
            });
        }
        console.log(`   ✅ ${branches.length} รายการ`);

        console.log('👤 2/13 ย้ายข้อมูล Users...');
        const users = await getLegacyData('users');
        for (const u of users) {
            await prisma.user.upsert({
                where: { userId: u.user_id || u.userid },
                update: {},
                create: {
                    userId: u.user_id || u.userid,
                    username: u.username,
                    password: u.password,
                    role: parseInt(u.role) || 1,
                    branchCode: u.branch_code || u.branchcode || 'MAIN',
                    status: u.status || 'ACTIVE'
                }
            });
        }
        console.log(`   ✅ ${users.length} รายการ`);

        console.log('🏢 3/13 ย้ายข้อมูล Principals...');
        const principals = await getLegacyData('principals');
        for (const p of principals) {
            await prisma.principal.upsert({
                where: { principalCode: p.principal_code || p.principalcode },
                update: {},
                create: {
                    principalCode: p.principal_code || p.principalcode,
                    principalName: p.principal_name || p.principalname,
                    status: p.status || 'ACTIVE'
                }
            });
        }
        console.log(`   ✅ ${principals.length} รายการ`);

        console.log('🏷️ 4/13 ย้ายข้อมูล Brands...');
        const brands = await getLegacyData('brands');
        for (const b of brands) {
            await prisma.brand.upsert({
                where: { brandCode: b.brand_code || b.brandcode },
                update: {},
                create: {
                    brandCode: b.brand_code || b.brandcode,
                    brandName: b.brand_name || b.brandname,
                    status: b.status || 'ACTIVE'
                }
            });
        }
        console.log(`   ✅ ${brands.length} รายการ`);

        console.log('📏 5/13 ย้ายข้อมูล UOMs...');
        const uoms = await getLegacyData('uoms');
        for (const u of uoms) {
            await prisma.uOM.upsert({
                where: { uomCode: u.uom_code || u.uomcode },
                update: {},
                create: {
                    uomCode: u.uom_code || u.uomcode,
                    uomName: u.uom_name || u.uomname,
                    status: u.status || 'ACTIVE'
                }
            });
        }
        console.log(`   ✅ ${uoms.length} รายการ`);

        // --- 2. ย้ายข้อมูล Warehouse & Location ---
        console.log('🏭 6/13 ย้ายข้อมูล Warehouses...');
        const warehouses = await getLegacyData('warehouses');
        for (const w of warehouses) {
            await prisma.warehouse.upsert({
                where: { whCode: w.wh_code || w.whcode },
                update: {},
                create: {
                    whCode: w.wh_code || w.whcode,
                    whName: w.wh_name || w.whname,
                    branchCode: w.branch_code || w.branchcode,
                    status: w.status || 'ACTIVE',
                    seq: w.seq || 0
                }
            });
        }
        console.log(`   ✅ ${warehouses.length} รายการ`);

        console.log('📍 7/13 ย้ายข้อมูล Locations...');
        const locations = await getLegacyData('locations');
        for (const l of locations) {
            await prisma.location.upsert({
                where: { whCode_locCode: { whCode: l.wh_code || l.whcode, locCode: l.loc_code || l.loccode } },
                update: {},
                create: {
                    whCode: l.wh_code || l.whcode,
                    locCode: l.loc_code || l.loccode,
                    locName: l.loc_name || l.locname,
                    status: l.status || 'ACTIVE'
                }
            });
        }
        console.log(`   ✅ ${locations.length} รายการ`);

        // สร้าง Default Location (locCode = '') สำหรับทุก Warehouse
        console.log('📍 7.1/13 สร้าง Default Location สำหรับแต่ละคลัง...');
        for (const w of warehouses) {
            const whCode = w.wh_code || w.whcode;
            await prisma.location.upsert({
                where: { whCode_locCode: { whCode: whCode, locCode: '' } },
                update: {},
                create: {
                    whCode: whCode,
                    locCode: '',
                    locName: 'Default',
                    status: 'ACTIVE'
                }
            });
        }
        console.log(`   ✅ สร้าง Default Location ${warehouses.length} รายการ`);

        // --- 3. ย้ายข้อมูลสินค้า ---
        console.log('🍎 8/13 ย้ายข้อมูล Products...');
        const products = await getLegacyData('products');
        for (const p of products) {
            await prisma.product.upsert({
                where: { productCode: p.product_code || p.productcode },
                update: {
                    productName: p.product_name || p.productname,
                    principalCode: p.principal_code || p.principalcode,
                    brandCode: p.brand_code || p.brandcode,
                    status: p.status || 'ACTIVE',
                    shelfLife: parseInt(p.shelflife) || 0,
                    maxMfgDays: parseInt(p.maxmfgdays) || 0,
                    stockControl: p.stockcontrol || 'FEFO',
                    caseWeight: p.caseweight || 0,
                    caseWidth: p.casewidth || 0,
                    caseLength: p.caselength || 0,
                    caseHeight: p.caseheight || 0,
                    caseVolume: p.casevolume || 0,
                    allowPartialIn: p.allowpartialin || 'YES',
                    allowPartialOut: p.allowpartialout || 'YES',
                    pieceBarcode: p.piecebarcode || null,
                    packBarcode: p.packbarcode || null,
                    innerBarcode: p.innerbarcode || null,
                    caseBarcode: p.casebarcode || null,
                    principalProductCode: p.principalproductcode || null,
                    imgPath: p.imgpath || null
                },
                create: {
                    productCode: p.product_code || p.productcode,
                    productName: p.product_name || p.productname,
                    principalCode: p.principal_code || p.principalcode,
                    brandCode: p.brand_code || p.brandcode,
                    status: p.status || 'ACTIVE',
                    shelfLife: parseInt(p.shelflife) || 0,
                    maxMfgDays: parseInt(p.maxmfgdays) || 0,
                    stockControl: p.stockcontrol || 'FEFO',
                    caseWeight: p.caseweight || 0,
                    caseWidth: p.casewidth || 0,
                    caseLength: p.caselength || 0,
                    caseHeight: p.caseheight || 0,
                    caseVolume: p.casevolume || 0,
                    allowPartialIn: p.allowpartialin || 'YES',
                    allowPartialOut: p.allowpartialout || 'YES',
                    pieceBarcode: p.piecebarcode || null,
                    packBarcode: p.packbarcode || null,
                    innerBarcode: p.innerbarcode || null,
                    caseBarcode: p.casebarcode || null,
                    principalProductCode: p.principalproductcode || null,
                    imgPath: p.imgpath || null
                }
            });
        }
        console.log(`   ✅ ${products.length} รายการ`);

        console.log('📦 9/13 ย้ายข้อมูล ProductUOMs...');
        const productUoms = await getLegacyData('productuoms');
        for (const pu of productUoms) {
            await prisma.productUOM.upsert({
                where: { productCode_uomCode: { productCode: pu.product_code || pu.productcode, uomCode: pu.uom_code || pu.uomcode } },
                update: {},
                create: {
                    productCode: pu.product_code || pu.productcode,
                    uomCode: pu.uom_code || pu.uomcode,
                    uomRatio: parseInt(pu.uom_ratio || pu.uomratio) || 1,
                    status: pu.status || 'ACTIVE'
                }
            });
        }
        console.log(`   ✅ ${productUoms.length} รายการ`);

        // --- 4. ย้ายการตั้งค่าเอกสาร ---
        console.log('📄 10/13 ย้ายข้อมูล DocumentTypes...');
        const legacyDocTypes = await getLegacyData('documenttypes');
        for (const dt of legacyDocTypes) {
            const code = dt.doc_type_code || dt.doctypecode;
            // กำหนดทิศทางตามรหัสเอกสาร (ใช้ค่าจากระบบเก่าก่อน)
            let movementType = dt.movement_type || dt.movementtype;
            if (!movementType) {
                // Default mapping based on document type
                if (['IN', 'RCV', 'BEG', 'RTN'].includes(code)) {
                    movementType = 'IN';
                } else if (['OUT', 'ISS', 'SHP'].includes(code)) {
                    movementType = 'OUT';
                } else {
                    // ADJ, TRN - default to IN (จะคำนวณทิศทางจาก context ตอนใช้งาน)
                    movementType = 'IN';
                }
            }

            await prisma.documentType.upsert({
                where: { docTypeCode: code },
                update: {
                    docTypeName: dt.doc_type_name || dt.doctypename,
                    movementType: movementType
                },
                create: {
                    docTypeCode: code,
                    docTypeName: dt.doc_type_name || dt.doctypename,
                    movementType: movementType,
                    status: dt.status || 'ACTIVE'
                }
            });
        }

        // สร้าง BEG (Beginning Balance) DocumentType ถ้ายังไม่มี
        await prisma.documentType.upsert({
            where: { docTypeCode: 'BEG' },
            update: {},
            create: {
                docTypeCode: 'BEG',
                docTypeName: 'Beginning Balance',
                movementType: 'IN',
                status: 'ACTIVE'
            }
        });
        console.log(`   ✅ ${legacyDocTypes.length} รายการ (+BEG)`);

        console.log('🔢 11/13 ย้ายข้อมูล MovementTypes...');
        const movTypes = await getLegacyData('movementtypes');
        for (const mt of movTypes) {
            // แปลง stocksign (+1/-1) เป็น direction (IN/OUT)
            const stocksign = parseInt(mt.stocksign) || 1;
            const direction = stocksign === 1 ? 'IN' : 'OUT';

            await prisma.movementType.upsert({
                where: { movementTypeCode: mt.movement_type_code || mt.movementtypecode },
                update: { direction: direction },
                create: {
                    movementTypeCode: mt.movement_type_code || mt.movementtypecode,
                    movementTypeName: mt.movement_type_name || mt.movementtypename,
                    direction: direction,
                    status: mt.status || 'ACTIVE'
                }
            });
        }
        console.log(`   ✅ ${movTypes.length} รายการ`);

        // --- 5. ย้ายสต็อกและรายการคงเหลือ (สำคัญมาก) ---
        console.log('📊 12/13 ย้ายยอด Stock ปัจจุบัน...');
        const stocks = await getLegacyData('stocks');
        let stockCount = 0;
        let stockSkip = 0;
        for (const s of stocks) {
            const product_code = s.product_code || s.productcode;
            const wh_code = s.wh_code || s.whcode;
            const loc_code = s.loc_code || s.loccode || '';
            const bal = parseInt(s.balance) || 0;

            if (bal > 0) {
                try {
                    // ตรวจสอบว่า warehouse และ product มีอยู่หรือไม่
                    const whExists = await prisma.warehouse.findUnique({ where: { whCode: wh_code } });
                    const prodExists = await prisma.product.findUnique({ where: { productCode: product_code } });

                    if (!whExists || !prodExists) {
                        stockSkip++;
                        continue;
                    }

                    await prisma.stock.upsert({
                        where: { productCode_whCode_locCode: { productCode: product_code, whCode: wh_code, locCode: loc_code } },
                        update: { balance: bal, qty: bal },
                        create: {
                            productCode: product_code,
                            whCode: wh_code,
                            locCode: loc_code,
                            balance: bal,
                            qty: bal
                        }
                    });

                    // สร้าง Log ยอดยกมา
                    await prisma.stockLog.create({
                        data: {
                            functionName: 'MIGRATE_SET_BALANCE',
                            docNo: 'MIGRATION-OB',
                            productCode: product_code,
                            whCode: wh_code,
                            balanceOld: 0,
                            pieceQty: bal,
                            balanceNew: bal,
                            createdUserId: 'SYSTEM',
                            updatedUserId: 'SYSTEM'
                        }
                    });
                    stockCount++;
                } catch (err) {
                    stockSkip++;
                }
            }
        }
        console.log(`   ✅ ${stockCount} รายการ (ข้าม: ${stockSkip})`);

        console.log('📅 13/13 ย้ายยอด StockDate (Lot ข้อมูล)...');
        const stockDates = await getLegacyData('stockdates');
        let stockDateCount = 0;
        for (const sd of stockDates) {
            const bal = parseInt(sd.balance) || 0;
            const mfgDate = sd.mfg_date || sd.mfgdate;
            const expDate = sd.exp_date || sd.expdate;

            if (bal > 0 && mfgDate && expDate) {
                try {
                    await prisma.stockDate.upsert({
                        where: {
                            productCode_whCode_locCode_mfgDate_expDate: {
                                productCode: sd.product_code || sd.productcode,
                                whCode: sd.wh_code || sd.whcode,
                                locCode: sd.loc_code || sd.loccode || '',
                                mfgDate: new Date(mfgDate),
                                expDate: new Date(expDate)
                            }
                        },
                        update: { balance: bal, qty: bal },
                        create: {
                            productCode: sd.product_code || sd.productcode,
                            whCode: sd.wh_code || sd.whcode,
                            locCode: sd.loc_code || sd.loccode || '',
                            mfgDate: new Date(mfgDate),
                            expDate: new Date(expDate),
                            balance: bal,
                            qty: bal
                        }
                    });
                    stockDateCount++;
                } catch (err) {
                    // Skip records with invalid dates or missing references
                }
            }
        }
        console.log(`   ✅ ${stockDateCount} รายการ`);

        // หมายเหตุ: ไม่ต้องสร้าง BEG transactions เพราะ migrate transactions ทั้งหมดอยู่แล้ว
        // การสร้าง BEG จาก stock balance + migrate transactions = นับซ้ำ (Double Counting)

        // ========== ส่วนที่ 14: ย้ายเอกสาร Transaction ==========
        console.log('\n📝 14/14 ย้ายเอกสาร Transaction...');

        const headersRes = await legacy.query(`
            SELECT * FROM transaction_headers 
            ORDER BY docno
        `);
        const headers = headersRes.rows;
        console.log(`   พบเอกสาร: ${headers.length} รายการ`);

        // Pre-fetch ข้อมูลเพื่อเพิ่มความเร็ว
        console.log('   ⚡ กำลังเตรียมข้อมูล...');

        // 1. ดึงเอกสารที่มีอยู่แล้วในระบบใหม่
        const existingDocs = await prisma.transactionHeader.findMany({ select: { docNo: true } });
        const existingDocSet = new Set(existingDocs.map(d => d.docNo));
        console.log(`      - เอกสารที่มีอยู่แล้ว: ${existingDocSet.size}`);

        // 2. ดึง Users ทั้งหมด
        const allUsers = await prisma.user.findMany();
        const userMap = new Map(allUsers.map(u => [u.userId, u]));
        const defaultUser = allUsers[0];
        console.log(`      - Users: ${allUsers.length}`);

        // 3. ดึง Warehouses ที่มีอยู่
        const allWarehouses = await prisma.warehouse.findMany({ select: { whCode: true } });
        const whSet = new Set(allWarehouses.map(w => w.whCode));
        console.log(`      - Warehouses: ${whSet.size}`);

        // 4. ดึง Products ที่มีอยู่
        const allProducts = await prisma.product.findMany({ select: { productCode: true } });
        const prodSet = new Set(allProducts.map(p => p.productCode));
        console.log(`      - Products: ${prodSet.size}`);

        // 5. ดึง Details ทั้งหมดจากระบบเก่า (ครั้งเดียว)
        console.log('      - กำลังดึง Header & Details จากระบบเก่า...');
        const allDetailsRes = await legacy.query('SELECT * FROM transaction_details ORDER BY docno, id');
        const detailsByDocNo = new Map();
        for (const d of allDetailsRes.rows) {
            if (!detailsByDocNo.has(d.docno)) {
                detailsByDocNo.set(d.docno, []);
            }
            detailsByDocNo.get(d.docno).push(d);
        }
        console.log(`      - Details: ${allDetailsRes.rows.length} รายการ`);
        console.log('   ⚡ เตรียมข้อมูลเสร็จ! เริ่มย้ายเอกสาร...\n');

        let docSuccess = 0;
        let docSkip = 0;
        let docError = 0;

        for (let i = 0; i < headers.length; i++) {
            const h = headers[i];
            const docNo = h.docno;

            try {
                // ใช้ Set แทน query
                if (existingDocSet.has(docNo)) {
                    docSkip++;
                    continue;
                }

                // ตรวจสอบ Warehouse ต้นทาง
                if (!whSet.has(h.whcode)) {
                    docError++;
                    errorLogs.push(`[DOC] ${docNo}: Source warehouse ${h.whcode} not found`);
                    continue;
                }

                // ตรวจสอบ Warehouse ปลายทาง (ถ้ามี)
                if (h.towhcode && !whSet.has(h.towhcode)) {
                    docError++;
                    errorLogs.push(`[DOC] ${docNo}: Destination warehouse ${h.towhcode} not found`);
                    continue;
                }

                // ใช้ Map แทน query
                const details = detailsByDocNo.get(docNo) || [];

                // กรอง details ที่มี product และ warehouse ถูกต้อง
                const validDetails = details.filter(d => {
                    const detailProduct = d.productcode;
                    const detailWh = d.whcode || h.whcode;

                    if (!prodSet.has(detailProduct)) {
                        errorLogs.push(`[DETAIL] ${docNo}: Product ${detailProduct} not found - skipped`);
                        return false;
                    }
                    if (!whSet.has(detailWh)) {
                        errorLogs.push(`[DETAIL] ${docNo}: Warehouse ${detailWh} not found - skipped`);
                        return false;
                    }
                    return true;
                });

                // ถ้าไม่มี detail ที่ valid เลย ให้ข้าม
                if (validDetails.length === 0 && details.length > 0) {
                    docError++;
                    errorLogs.push(`[DOC] ${docNo}: All ${details.length} details have invalid products/warehouses`);
                    continue;
                }

                // ใช้ Map แทน query
                const userId = h.createduserid || 'SYSTEM';
                let user = userMap.get(userId) || defaultUser;

                if (!user) {
                    docError++;
                    errorLogs.push(`[DOC] ${docNo}: No user available`);
                    continue;
                }

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
                        docStatus: 'APPROVED',
                        docState: h.docstate || 'CLOSED',
                        createdBy: user.userId,
                        createdUserName: h.createdusername || null,
                        updatedUserName: h.updatedusername || null,
                        approvedBy: user.userId,
                        approvedAt: new Date(h.updated_at || h.created_at),
                        createdAt: new Date(h.created_at),
                        updatedAt: new Date(h.updated_at || h.created_at),
                        details: {
                            create: validDetails.map((d, idx) => ({
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

                docSuccess++;

                if ((i + 1) % 500 === 0 || i === headers.length - 1) {
                    console.log(`   📝 ${i + 1}/${headers.length} (สำเร็จ: ${docSuccess}, ข้าม: ${docSkip})`);
                }

            } catch (err) {
                docError++;
                errorLogs.push(`[DOC] ${docNo}: ${err.message}`);
            }
        }
        console.log(`   ✅ สำเร็จ: ${docSuccess}, ข้าม: ${docSkip}, ผิดพลาด: ${docError}`);

        // อัพเดท Running Number
        console.log('\n🔢 กำลังอัพเดท Running Number...');
        const docTypes = ['IN', 'OUT', 'TRN', 'ADJ'];
        for (const dtCode of docTypes) {
            const lastDoc = await prisma.transactionHeader.findFirst({
                where: { docTypeCode: dtCode },
                orderBy: { docNo: 'desc' }
            });

            if (lastDoc) {
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
        console.log('✅ Migration สำเร็จทั้งหมด!');
        console.log(`⏱️ ใช้เวลาทั้งสิ้น: ${((Date.now() - start) / 1000).toFixed(2)} วินาที`);

        // บันทึก error logs ลงไฟล์
        if (errorLogs.length > 0) {
            fs.writeFileSync(logFile, errorLogs.join('\n'), 'utf8');
            console.log(`📝 บันทึก Error ${errorLogs.length} รายการ ลงไฟล์: ${logFile}`);
        }

        console.log('==================================================');

    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการ Migration:', error);
    } finally {
        await legacy.end();
        await prisma.$disconnect();
    }
}

migrate();

