import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const uoms = await prisma.productUOM.findMany({
        where: { productCode: '1010100001' },
        select: { uomCode: true, uomRatio: true }
    })
    console.log(JSON.stringify(uoms, null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
