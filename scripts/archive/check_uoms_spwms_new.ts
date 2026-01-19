import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const products = await prisma.product.findMany({
        select: {
            productCode: true,
            productName: true,
            productUOMs: {
                select: {
                    uomCode: true
                }
            }
        },
        orderBy: { productCode: 'asc' }
    })

    console.log("Products with incomplete UOMs (less than 3):")
    const incomplete = products.filter(p => p.productUOMs.length < 3)

    incomplete.forEach(p => {
        const uoms = p.productUOMs.map(u => u.uomCode)
        const missing = []
        if (!uoms.includes('CTN')) missing.push('CTN')
        if (!uoms.includes('PAC')) missing.push('PAC')
        if (!uoms.includes('PCS')) missing.push('PCS')

        console.log(`- [${p.productCode}] ${p.productName}: Existing: [${uoms.join(', ')}], Missing: [${missing.join(', ')}]`)
    })
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
