const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanBeg() {
    console.log('🧹 Cleaning up BEG-MANUAL-001...');

    // Delete detail first (FK constraint)
    const deletedDetails = await prisma.transactionDetail.deleteMany({
        where: { docNo: 'BEG-MANUAL-001' }
    });
    console.log(`Deleted ${deletedDetails.count} detail record(s).`);

    // Delete header
    const deletedHeaders = await prisma.transactionHeader.deleteMany({
        where: { docNo: 'BEG-MANUAL-001' }
    });
    console.log(`Deleted ${deletedHeaders.count} header record(s).`);

    console.log('✅ Cleanup complete!');
}

cleanBeg().finally(() => prisma.$disconnect());
