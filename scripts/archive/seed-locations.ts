import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedLocations() {
    const warehouses = await prisma.warehouse.findMany({
        where: { status: 'ACTIVE' }
    });

    console.log(`Found ${warehouses.length} active warehouses`);

    for (const wh of warehouses) {
        await prisma.location.createMany({
            data: [
                { whCode: wh.whCode, locCode: 'RECV-01', locName: 'พื้นที่รับสินค้า', status: 'ACTIVE' },
                { whCode: wh.whCode, locCode: 'PICK-01', locName: 'พื้นที่หยิบสินค้า', status: 'ACTIVE' },
                { whCode: wh.whCode, locCode: 'RACK-A1', locName: 'ชั้นวาง A1', status: 'ACTIVE' },
                { whCode: wh.whCode, locCode: 'RACK-A2', locName: 'ชั้นวาง A2', status: 'ACTIVE' },
            ],
            skipDuplicates: true,
        });
        console.log(`Created locations for warehouse: ${wh.whCode}`);
    }

    console.log('✅ Location seeding completed!');
    await prisma.$disconnect();
}

seedLocations().catch(console.error);
