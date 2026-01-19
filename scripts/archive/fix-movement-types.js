// Fix Movement Types direction
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('=== Fixing Movement Type Directions ===\n');

    // Movement types that should be OUT
    const outTypes = [
        { code: '211', name: 'จ่ายออก' },
        { code: '302', name: 'โอนย้ายระหว่างคลัง' },
        { code: '402', name: 'ปรับปรุงลด' },
    ];

    for (const mt of outTypes) {
        const updated = await prisma.movementType.updateMany({
            where: { movementTypeCode: mt.code },
            data: { direction: 'OUT' }
        });
        console.log(`✅ ${mt.code} (${mt.name}): Changed to OUT - ${updated.count} updated`);
    }

    // Verify
    console.log('\n=== Current Movement Types ===');
    const all = await prisma.movementType.findMany({ orderBy: { movementTypeCode: 'asc' } });
    console.table(all.map(m => ({
        code: m.movementTypeCode,
        name: m.movementTypeName,
        direction: m.direction,
        status: m.status
    })));

    await prisma.$disconnect();
}

main();
