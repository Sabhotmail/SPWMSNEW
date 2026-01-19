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
        }
    })

    console.log("Products with missing UOMs (less than CTN, PAC, PCS):")
    const incomplete = products.filter(p => p.productUOMs.length < 3)

    incomplete.forEach(p => {
        const uoms = p.productUOMs.map(u => u.uomCode)
        console.log(`- [${p.productCode}] ${p.productName}: [${uoms.join(', ')}]`)
    })
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
