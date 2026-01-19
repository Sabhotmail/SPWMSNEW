const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const uomCount = await prisma.uOM.count();
        const productUomCount = await prisma.productUOM.count();

        console.log('--- Current System Data ---');
        console.log('Total UOMs:', uomCount);
        console.log('Total ProductUOMs:', productUomCount);

        if (uomCount > 0) {
            const uoms = await prisma.uOM.findMany();
            console.table(uoms.map(u => ({ code: u.uomCode, name: u.uomName })));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
