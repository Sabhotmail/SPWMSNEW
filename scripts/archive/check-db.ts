import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Checking Document Types ---')
    const docTypes = await prisma.documentType.findMany()
    console.table(docTypes.map(d => ({
        code: d.docTypeCode,
        name: d.docTypeName,
        movement: d.movementType
    })))

    console.log('\n--- Checking Transaction: OUT25000001 ---')
    const transaction = await prisma.transactionHeader.findUnique({
        where: { docNo: 'OUT25000001' },
        include: {
            details: true,
            documentType: true
        }
    })

    if (transaction) {
        console.log('DocNo:', transaction.docNo)
        console.log('DocType:', transaction.docTypeCode)
        console.log('Movement:', transaction.documentType.movementType)
        console.log('Details:')
        console.table(transaction.details.map(d => ({
            product: d.productCode,
            qty: d.pieceQty,
            uom: d.uomCode
        })))
    } else {
        console.log('Transaction OUT25000001 not found')
    }

    await prisma.$disconnect()
}

main()
