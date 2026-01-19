// Remove new document types (keep only legacy ones)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('=== Removing New Document Types ===\n');

    // Document types to remove (new ones)
    const toRemove = ['GR', 'GI', 'INS'];

    for (const code of toRemove) {
        try {
            await prisma.documentType.delete({
                where: { docTypeCode: code }
            });
            console.log(`✅ Removed: ${code}`);
        } catch (err) {
            console.log(`⚠️ ${code}: ${err.message}`);
        }
    }

    // Show final result
    console.log('\n=== Remaining Document Types ===');
    const final = await prisma.documentType.findMany({ orderBy: { docTypeCode: 'asc' } });
    console.table(final.map(d => ({
        code: d.docTypeCode,
        name: d.docTypeName,
        movement: d.movementType,
        status: d.status
    })));

    await prisma.$disconnect();
}

main();
