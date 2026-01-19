const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log('--- Document Types ---');
    const docTypes = await prisma.documentType.findMany();
    docTypes.forEach(d => {
        console.log(`Code: ${d.docTypeCode}, Name: ${d.docTypeName}, MovementType: ${d.movementType}`);
    });

    console.log('\n--- Movement Types ---');
    const moveTypes = await prisma.movementType.findMany();
    moveTypes.forEach(m => {
        console.log(`Code: ${m.movementTypeCode}, Name: ${m.movementTypeName}, Direction: ${m.direction}`);
    });
}

check()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
