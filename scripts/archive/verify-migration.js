const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const uom = await prisma.uOM.findUnique({
            where: { uomCode: 'PAC' }
        });
        console.log('UOM PAC:', uom);

        const count = await prisma.productUOM.count({
            where: { uomCode: 'PAC' }
        });
        console.log('ProductUOM PAC count:', count);

        const example = await prisma.productUOM.findFirst({
            where: { uomCode: 'PAC' },
            include: { product: true }
        });
        console.log('Example ProductUOM PAC:', example);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
