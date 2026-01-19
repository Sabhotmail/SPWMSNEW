const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const productCode = '1010010001';
        const whCode = '42G1';

        console.log(`🔎 ค้นหาข้อมูลสินค้า ${productCode} ทั้งหมด...`);

        const logs = await prisma.transactionDetail.findMany({
            where: { productCode: productCode },
            include: {
                header: {
                    include: {
                        documentType: true
                    }
                }
            },
            orderBy: { header: { docDate: 'asc' } }
        });

        console.log(`📊 พบรายการทั้งหมด ${logs.length} รายการ`);

        let balance = 0;
        logs.forEach(log => {
            const qty = Number(log.pieceQty);
            let move = 0;
            if (log.header.docTypeCode === 'TRN') {
                if (log.header.whCode === whCode) move = -qty;
                if (log.header.toWhCode === whCode) move = qty;
            } else {
                move = log.header.documentType.movementType === 'IN' ? qty : -qty;
            }
            balance += move;
            console.log(`[${log.header.docDate.toISOString().split('T')[0]}] ${log.docNo} | ${log.header.docTypeCode} | ${move / 72} ลัง | Balance: ${balance / 72} ลัง`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
