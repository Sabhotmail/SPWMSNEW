// Check document type counts
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('=== Document Type Counts ===');
    const types = await prisma.transactionHeader.groupBy({
        by: ['docTypeCode'],
        _count: true
    });
    console.table(types);

    console.log('\n=== Sample INS/GR Documents ===');
    const samples = await prisma.transactionHeader.findMany({
        where: { docTypeCode: { in: ['GR', 'INS'] } },
        take: 5,
        select: { docNo: true, docTypeCode: true, docStatus: true, whCode: true }
    });
    console.table(samples);

    await prisma.$disconnect();
}

main();
