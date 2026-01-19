import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    await prisma.transactionDetail.deleteMany()
    await prisma.transactionHeader.deleteMany()
    console.log('Cleared transaction data')
}
main().finally(() => prisma.$disconnect())
