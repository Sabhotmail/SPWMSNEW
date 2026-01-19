import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTestData() {
    console.log('🚀 Starting test data seeding...');

    // 1. สร้าง Movement Types (ถ้ายังไม่มี)
    const movementTypes = [
        { movementTypeCode: 'GR', movementTypeName: 'ใบรับสินค้า', direction: 'IN' },
        { movementTypeCode: 'GI', movementTypeName: 'ใบเบิกสินค้า', direction: 'OUT' },
        { movementTypeCode: 'ADJ-IN', movementTypeName: 'ปรับปรุงเพิ่ม', direction: 'IN' },
        { movementTypeCode: 'ADJ-OUT', movementTypeName: 'ปรับปรุงลด', direction: 'OUT' },
        { movementTypeCode: 'TRN', movementTypeName: 'โอนย้าย', direction: 'OUT' },
    ];

    for (const mt of movementTypes) {
        await prisma.movementType.upsert({
            where: { movementTypeCode: mt.movementTypeCode },
            update: {},
            create: { ...mt, status: 'ACTIVE' },
        });
    }
    console.log('✅ Movement Types created');

    // 2. สร้าง Document Types (ถ้ายังไม่มี)
    const docTypes = [
        { docTypeCode: 'GR', docTypeName: 'ใบรับสินค้า', movementType: 'IN' },
        { docTypeCode: 'GI', docTypeName: 'ใบเบิกสินค้า', movementType: 'OUT' },
        { docTypeCode: 'TRN', docTypeName: 'ใบโอนย้าย', movementType: 'TRN' },
        { docTypeCode: 'ADJ', docTypeName: 'ใบปรับปรุงสต็อก', movementType: 'BOTH' },
    ];

    for (const dt of docTypes) {
        await prisma.documentType.upsert({
            where: { docTypeCode: dt.docTypeCode },
            update: {},
            create: { ...dt, status: 'ACTIVE' },
        });
    }
    console.log('✅ Document Types created');

    // 3. สร้าง UOMs (ถ้ายังไม่มี)
    const uoms = [
        { uomCode: 'PCS', uomName: 'ชิ้น' },
        { uomCode: 'BOX', uomName: 'กล่อง' },
        { uomCode: 'KG', uomName: 'กิโลกรัม' },
        { uomCode: 'SET', uomName: 'ชุด' },
    ];

    for (const uom of uoms) {
        await prisma.uOM.upsert({
            where: { uomCode: uom.uomCode },
            update: {},
            create: { ...uom, status: 'ACTIVE' },
        });
    }
    console.log('✅ UOMs created');

    // 3. สร้าง Principals (ถ้ายังไม่มี)
    const principals = [
        { principalCode: 'SUP001', principalName: 'บริษัท ซัพพลายเออร์ A จำกัด' },
        { principalCode: 'SUP002', principalName: 'ห้างหุ้นส่วน B' },
    ];

    for (const p of principals) {
        await prisma.principal.upsert({
            where: { principalCode: p.principalCode },
            update: {},
            create: { ...p, status: 'ACTIVE' },
        });
    }
    console.log('✅ Principals created');

    // 4. ตรวจสอบว่ามี Warehouse หรือยัง
    let warehouse = await prisma.warehouse.findFirst({ where: { status: 'ACTIVE' } });
    if (!warehouse) {
        warehouse = await prisma.warehouse.create({
            data: { whCode: 'WH01', whName: 'คลังหลัก', status: 'ACTIVE' },
        });
    }
    console.log(`✅ Using warehouse: ${warehouse.whCode}`);

    // 5. สร้าง Products (ถ้ายังไม่มี)
    const products = [
        { productCode: 'PROD001', productName: 'สินค้าทดสอบ 1', baseUomCode: 'PCS' },
        { productCode: 'PROD002', productName: 'สินค้าทดสอบ 2', baseUomCode: 'BOX' },
        { productCode: 'PROD003', productName: 'สินค้าทดสอบ 3', baseUomCode: 'KG' },
    ];

    for (const prod of products) {
        await prisma.product.upsert({
            where: { productCode: prod.productCode },
            update: {},
            create: { ...prod, status: 'ACTIVE' },
        });
    }
    console.log('✅ Products created');

    // 6. ตรวจสอบว่ามี User หรือยัง
    let user = await prisma.user.findFirst();
    if (!user) {
        user = await prisma.user.create({
            data: {
                userId: 'admin',
                username: 'Admin',
                password: '$2b$10$example', // placeholder
                branchCode: 'HQ',
                role: 9,
                status: 'ACTIVE',
            },
        });
    }
    console.log(`✅ Using user: ${user.userId}`);

    // 7. สร้าง Transaction Headers (เอกสารทดสอบ)
    const today = new Date();
    const transactions = [
        // ใบรับสินค้า - อนุมัติแล้ว
        {
            docNo: `GR${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}-0001`,
            docTypeCode: 'GR',
            docDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 วันก่อน
            whCode: warehouse.whCode,
            docStatus: 'APPROVED',
            remark: 'รับสินค้าจากซัพพลายเออร์ A',
            createdBy: user.userId,
            details: [
                { productCode: 'PROD001', qty: 100, uomCode: 'PCS', changeQty: 100 },
                { productCode: 'PROD002', qty: 50, uomCode: 'BOX', changeQty: 50 },
            ],
        },
        // ใบรับสินค้า - รอดำเนินการ
        {
            docNo: `GR${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}-0002`,
            docTypeCode: 'GR',
            docDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 วันก่อน
            whCode: warehouse.whCode,
            docStatus: 'DRAFT',
            remark: 'รับสินค้าเพิ่มเติม',
            createdBy: user.userId,
            details: [
                { productCode: 'PROD003', qty: 25, uomCode: 'KG', changeQty: 25 },
            ],
        },
        // ใบเบิกสินค้า - อนุมัติแล้ว
        {
            docNo: `GI${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}-0001`,
            docTypeCode: 'GI',
            docDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 วันก่อน
            whCode: warehouse.whCode,
            docStatus: 'APPROVED',
            remark: 'เบิกสินค้าไปหน้าร้าน',
            createdBy: user.userId,
            details: [
                { productCode: 'PROD001', qty: 20, uomCode: 'PCS', changeQty: -20 },
            ],
        },
        // ใบเบิกสินค้า - รอดำเนินการ
        {
            docNo: `GI${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}-0002`,
            docTypeCode: 'GI',
            docDate: today,
            whCode: warehouse.whCode,
            docStatus: 'DRAFT',
            remark: 'รอเบิกสินค้า',
            createdBy: user.userId,
            details: [
                { productCode: 'PROD002', qty: 10, uomCode: 'BOX', changeQty: -10 },
            ],
        },
        // ใบที่ถูกยกเลิก
        {
            docNo: `GR${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}-0003`,
            docTypeCode: 'GR',
            docDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 วันก่อน
            whCode: warehouse.whCode,
            docStatus: 'CANCELLED',
            remark: 'ยกเลิกเนื่องจากพิมพ์ผิด',
            createdBy: user.userId,
            details: [
                { productCode: 'PROD001', qty: 5, uomCode: 'PCS', changeQty: 5 },
            ],
        },
    ];

    for (const tx of transactions) {
        const existing = await prisma.transactionHeader.findFirst({
            where: { docNo: tx.docNo },
        });

        if (!existing) {
            const header = await prisma.transactionHeader.create({
                data: {
                    docNo: tx.docNo,
                    docTypeCode: tx.docTypeCode,
                    docDate: tx.docDate,
                    postDate: tx.docDate,
                    whCode: tx.whCode,
                    docStatus: tx.docStatus,
                    remark: tx.remark,
                    createdBy: tx.createdBy,
                },
            });

            // Create details separately
            for (let idx = 0; idx < tx.details.length; idx++) {
                const d = tx.details[idx];
                await prisma.transactionDetail.create({
                    data: {
                        docNo: tx.docNo,
                        lineNo: idx + 1,
                        productCode: d.productCode,
                        qty: d.qty,
                        uomCode: d.uomCode,
                        whCode: tx.whCode,
                        locCode: 'RECV-01',
                        status: 'ACTIVE',
                    },
                });
            }
            console.log(`✅ Created: ${tx.docNo} (${tx.docStatus})`);
        } else {
            console.log(`⏭️ Skipped (exists): ${tx.docNo}`);
        }
    }

    // 8. สร้าง Stock สำหรับสินค้าที่อนุมัติแล้ว
    const stockData = [
        { productCode: 'PROD001', whCode: warehouse.whCode, qty: 80 }, // 100 - 20
        { productCode: 'PROD002', whCode: warehouse.whCode, qty: 50 },
    ];

    for (const stock of stockData) {
        // Try to find existing stock
        const existingStock = await prisma.stock.findFirst({
            where: {
                productCode: stock.productCode,
                whCode: stock.whCode,
            },
        });

        if (existingStock) {
            await prisma.stock.update({
                where: { id: existingStock.id },
                data: { qty: stock.qty },
            });
        } else {
            await prisma.stock.create({
                data: { ...stock, locCode: 'RECV-01' },
            });
        }
    }
    console.log('✅ Stock data created');

    console.log('\n🎉 Test data seeding completed!');
    console.log('📊 Summary:');
    console.log('   - Document Types: 3');
    console.log('   - UOMs: 4');
    console.log('   - Principals: 2');
    console.log('   - Products: 3');
    console.log('   - Transactions: 5 (2 APPROVED, 2 DRAFT, 1 CANCELLED)');
    console.log('   - Stock records: 2');

    await prisma.$disconnect();
}

seedTestData().catch(console.error);
