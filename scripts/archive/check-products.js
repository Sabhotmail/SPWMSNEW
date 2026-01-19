// ตรวจสอบข้อมูล Products
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const products = await prisma.product.findMany({
        take: 5,
        select: { productCode: true, productName: true, principalCode: true, brandCode: true }
    });
    console.table(products);

    const principals = await prisma.principal.findMany({ take: 5 });
    console.log('\nPrincipals:');
    console.table(principals.map(p => ({ code: p.principalCode, name: p.principalName })));

    await prisma.$disconnect();
}

check();
