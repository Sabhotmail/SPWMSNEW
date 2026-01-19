// Add missing document types
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const docTypes = [
        { docTypeCode: 'ADJ', docTypeName: 'ปรับปรุงสต๊อก', movementType: 'IN' },
        { docTypeCode: 'INS', docTypeName: 'รับสินค้าเข้า', movementType: 'IN' },
        { docTypeCode: 'OUT', docTypeName: 'จ่ายสินค้าออก', movementType: 'OUT' }
    ];

    for (const dt of docTypes) {
        await prisma.documentType.upsert({
            where: { docTypeCode: dt.docTypeCode },
            update: dt,
            create: { ...dt, status: 'ACTIVE' }
        });
        console.log('Added:', dt.docTypeCode);
    }

    await prisma.$disconnect();
}

main();
