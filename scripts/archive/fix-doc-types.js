// Check and add missing document types
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Check existing document types
    const existing = await prisma.documentType.findMany();
    console.log('=== Existing Document Types ===');
    console.table(existing.map(t => ({
        code: t.docTypeCode,
        name: t.docTypeName,
        movement: t.movementType
    })));

    // Define all required document types
    const requiredTypes = [
        { docTypeCode: 'GR', docTypeName: 'รับสินค้า (Goods Receipt)', movementType: 'IN' },
        { docTypeCode: 'GI', docTypeName: 'จ่ายสินค้า (Goods Issue)', movementType: 'OUT' },
        { docTypeCode: 'TRN', docTypeName: 'โอนย้าย (Transfer)', movementType: 'OUT' },
        { docTypeCode: 'IN', docTypeName: 'รับสินค้าเข้า', movementType: 'IN' },
        { docTypeCode: 'OUT', docTypeName: 'จ่ายสินค้าออก', movementType: 'OUT' },
        { docTypeCode: 'ADJ', docTypeName: 'ปรับปรุงสต๊อก', movementType: 'IN' },
        { docTypeCode: 'INS', docTypeName: 'รับสินค้าเข้า (Legacy)', movementType: 'IN' },
    ];

    // Upsert each type
    console.log('\n=== Adding/Updating Document Types ===');
    for (const dt of requiredTypes) {
        const result = await prisma.documentType.upsert({
            where: { docTypeCode: dt.docTypeCode },
            update: { docTypeName: dt.docTypeName, movementType: dt.movementType },
            create: { ...dt, status: 'ACTIVE' }
        });
        console.log(`✅ ${dt.docTypeCode}: ${dt.docTypeName}`);
    }

    // Show final result
    const final = await prisma.documentType.findMany();
    console.log('\n=== Final Document Types ===');
    console.table(final.map(t => ({
        code: t.docTypeCode,
        name: t.docTypeName,
        movement: t.movementType
    })));

    await prisma.$disconnect();
}

main();
