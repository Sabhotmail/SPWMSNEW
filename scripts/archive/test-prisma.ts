import { prisma } from './src/lib/prisma'

async function main() {
    console.log('Testing TransactionHeader include warehouse...')
    try {
        const tx = await prisma.transactionHeader.findFirst({
            include: {
                warehouse: true
            }
        })
        console.log('Success! Warehouse found:', !!tx?.warehouse)
    } catch (error) {
        console.error('Error:', error.message)
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
