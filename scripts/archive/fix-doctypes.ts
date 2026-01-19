import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Fixing Document Types ---')

    await prisma.documentType.update({
        where: { docTypeCode: 'OUT' },
        data: { movementType: 'OUT' }
    })
    console.log('Updated OUT -> OUT')

    await prisma.documentType.update({
        where: { docTypeCode: 'ADJ' },
        data: { movementType: 'OUT' } // ปกติ ADJ ในระบบเดิมมักใช้ตอนตัดจ่าย แต่ความจริงควรดูตามเครื่องหมาย
    })
    console.log('Updated ADJ -> OUT')

    // สำหรับ TRN (โอนย้าย) เราจะใช้ Logic พิเศษใน Code อยู่แล้ว 
    // แต่พื้นฐานให้เป็น OUT ไว้ก่อนเพื่อให้ระบบรู้ว่ามีผลต่อสต็อก
    await prisma.documentType.update({
        where: { docTypeCode: 'TRN' },
        data: { movementType: 'OUT' }
    })
    console.log('Updated TRN -> OUT')

    await prisma.$disconnect()
}

main()
