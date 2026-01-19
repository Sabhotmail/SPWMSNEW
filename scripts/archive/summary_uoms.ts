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

    const incomplete = products.filter(p => p.productUOMs.length < 3)

    console.log(`Total Products: ${products.length}`)
    console.log(`Products with incomplete UOMs (< 3): ${incomplete.length}`)

    // Group by how many UOMs they have
    const counts = { 0: 0, 1: 0, 2: 0, 3: 0 }
    products.forEach(p => counts[p.productUOMs.length as keyof typeof counts]++)

    console.log('UOM Count distribution:')
    console.log(`- 0 UOMs: ${counts[0]}`)
    console.log(`- 1 UOM: ${counts[1]}`)
    console.log(`- 2 UOMs: ${counts[2]}`)
    console.log(`- 3 UOMs: ${counts[3]}`)

    console.log('\nExamples of incomplete products (top 20):')
    incomplete.slice(0, 20).forEach(p => {
        const uoms = p.productUOMs.map(u => u.uomCode)
        console.log(`- [${p.productCode}] ${p.productName}: [${uoms.join(', ')}]`)
    })
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
