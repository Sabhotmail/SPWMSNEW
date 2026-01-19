// Script สำหรับ Migrate ข้อมูล Master Data ทั้งหมดจากระบบเดิม
// รันด้วย: node migrate-all-master.js

const { Client } = require('pg');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const legacyClient = new Client({
    host: '192.168.10.15',
    port: 5432,
    database: 'siripro-stock',
    user: 'postgres',
    password: 'S1r1Pr0',
});

const prisma = new PrismaClient();

const stats = {
    principals: { total: 0, migrated: 0, errors: 0 },
    brands: { total: 0, migrated: 0, errors: 0 },
    warehouses: { total: 0, migrated: 0, errors: 0 },
    users: { total: 0, migrated: 0, errors: 0 },
    movementTypes: { total: 0, migrated: 0, errors: 0 },
    documentTypes: { total: 0, migrated: 0, errors: 0 },
    products: { total: 0, migrated: 0, errors: 0 },
    branches: { total: 0, migrated: 0, errors: 0 },
};

// =====================================
// 1. Migrate Principals
// =====================================
async function migratePrincipals() {
    console.log('\n📋 1. Migrating Principals...');
    const { rows } = await legacyClient.query('SELECT * FROM principals');
    stats.principals.total = rows.length;

    for (const row of rows) {
        try {
            await prisma.principal.upsert({
                where: { principalCode: row.principalcode },
                update: {
                    principalName: row.principalname || row.principalcode,
                    status: row.status || 'ACTIVE',
                },
                create: {
                    principalCode: row.principalcode,
                    principalName: row.principalname || row.principalcode,
                    status: row.status || 'ACTIVE',
                },
            });
            stats.principals.migrated++;
        } catch (e) {
            console.error(`  ❌ Principal ${row.principalcode}:`, e.message.substring(0, 80));
            stats.principals.errors++;
        }
    }
    console.log(`  ✅ Principals: ${stats.principals.migrated}/${stats.principals.total}`);
}

// =====================================
// 2. Migrate Brands
// =====================================
async function migrateBrands() {
    console.log('\n📋 2. Migrating Brands...');

    // Check if brands table exists in legacy
    try {
        const { rows } = await legacyClient.query('SELECT * FROM brands');
        stats.brands.total = rows.length;

        for (const row of rows) {
            try {
                await prisma.brand.upsert({
                    where: { brandCode: row.brandcode },
                    update: {
                        brandName: row.brandname || row.brandcode,
                        status: row.status || 'ACTIVE',
                    },
                    create: {
                        brandCode: row.brandcode,
                        brandName: row.brandname || row.brandcode,
                        status: row.status || 'ACTIVE',
                    },
                });
                stats.brands.migrated++;
            } catch (e) {
                console.error(`  ❌ Brand ${row.brandcode}:`, e.message.substring(0, 80));
                stats.brands.errors++;
            }
        }
    } catch (e) {
        console.log('  ⚠️ brands table not found in legacy, skipping...');
    }
    console.log(`  ✅ Brands: ${stats.brands.migrated}/${stats.brands.total}`);
}

// =====================================
// 3. Migrate Branches (create default if not exists)
// =====================================
async function migrateBranches() {
    console.log('\n📋 3. Migrating Branches...');

    try {
        // Try to extract unique branch codes from warehouses
        const { rows } = await legacyClient.query(`
            SELECT DISTINCT branchcode 
            FROM warehouses 
            WHERE branchcode IS NOT NULL AND branchcode != ''
        `);
        stats.branches.total = rows.length;

        for (const row of rows) {
            try {
                await prisma.branch.upsert({
                    where: { branchCode: row.branchcode },
                    update: {},
                    create: {
                        branchCode: row.branchcode,
                        branchName: `สาขา ${row.branchcode}`,
                        status: 'ACTIVE',
                    },
                });
                stats.branches.migrated++;
            } catch (e) {
                console.error(`  ❌ Branch ${row.branchcode}:`, e.message.substring(0, 80));
                stats.branches.errors++;
            }
        }
    } catch (e) {
        // branchcode column doesn't exist, create default branch
        console.log('  ⚠️ branchcode column not found in legacy warehouses, creating default...');
        try {
            await prisma.branch.upsert({
                where: { branchCode: 'HQ' },
                update: {},
                create: {
                    branchCode: 'HQ',
                    branchName: 'สำนักงานใหญ่',
                    status: 'ACTIVE',
                },
            });
            stats.branches.total = 1;
            stats.branches.migrated = 1;
        } catch (err) {
            console.error('  ❌ Failed to create default branch:', err.message);
            stats.branches.errors++;
        }
    }
    console.log(`  ✅ Branches: ${stats.branches.migrated}/${stats.branches.total}`);
}

// =====================================
// 4. Migrate Warehouses
// =====================================
async function migrateWarehouses() {
    console.log('\n📋 4. Migrating Warehouses...');
    const { rows } = await legacyClient.query('SELECT * FROM warehouses');
    stats.warehouses.total = rows.length;

    for (const row of rows) {
        try {
            // Handle cases where branchcode might not exist
            const branchCode = row.branchcode || null;

            await prisma.warehouse.upsert({
                where: { whCode: row.whcode },
                update: {
                    whName: row.whname || row.whcode,
                    branchCode: branchCode,
                    palletCapacity: parseInt(row.palletcapacity) || 0,
                    caseCapacity: parseInt(row.casecapacity) || 0,
                    seq: parseInt(row.seq) || 0,
                    status: row.status || 'ACTIVE',
                },
                create: {
                    whCode: row.whcode,
                    whName: row.whname || row.whcode,
                    branchCode: branchCode,
                    palletCapacity: parseInt(row.palletcapacity) || 0,
                    caseCapacity: parseInt(row.casecapacity) || 0,
                    seq: parseInt(row.seq) || 0,
                    status: row.status || 'ACTIVE',
                },
            });
            stats.warehouses.migrated++;
        } catch (e) {
            console.error(`  ❌ Warehouse ${row.whcode}:`, e.message.substring(0, 80));
            stats.warehouses.errors++;
        }
    }
    console.log(`  ✅ Warehouses: ${stats.warehouses.migrated}/${stats.warehouses.total}`);
}

// =====================================
// 5. Migrate Users
// =====================================
async function migrateUsers() {
    console.log('\n📋 5. Migrating Users...');
    const { rows } = await legacyClient.query('SELECT * FROM users');
    stats.users.total = rows.length;

    // Default password for migrated users (they should change it)
    const defaultPassword = await bcrypt.hash('12345678', 10);

    for (const row of rows) {
        try {
            // Map legacy role to new role number
            let roleNum = 1;
            if (row.role) {
                const roleStr = row.role.toString().toUpperCase();
                if (roleStr === 'ADMIN' || roleStr === '9') roleNum = 9;
                else if (roleStr === 'MANAGER' || roleStr === '7') roleNum = 7;
                else if (roleStr === 'SUPERVISOR' || roleStr === '5') roleNum = 5;
                else if (roleStr === 'USER' || roleStr === '1') roleNum = 1;
                else roleNum = parseInt(row.role) || 1;
            }

            await prisma.user.upsert({
                where: { userId: row.userid },
                update: {
                    username: row.username || row.userid,
                    email: row.email || null,
                    role: roleNum,
                    branchCode: row.branchcode || 'HQ',
                    status: row.status || 'ACTIVE',
                },
                create: {
                    userId: row.userid,
                    username: row.username || row.userid,
                    password: row.password || defaultPassword,
                    email: row.email || null,
                    role: roleNum,
                    branchCode: row.branchcode || 'HQ',
                    status: row.status || 'ACTIVE',
                },
            });
            stats.users.migrated++;
        } catch (e) {
            console.error(`  ❌ User ${row.userid}:`, e.message.substring(0, 80));
            stats.users.errors++;
        }
    }
    console.log(`  ✅ Users: ${stats.users.migrated}/${stats.users.total}`);
}

// =====================================
// 6. Migrate Movement Types
// =====================================
async function migrateMovementTypes() {
    console.log('\n📋 6. Migrating Movement Types...');
    const { rows } = await legacyClient.query('SELECT * FROM movementtypes');
    stats.movementTypes.total = rows.length;

    for (const row of rows) {
        try {
            // Map stocksign to direction
            let direction = 'IN';
            if (row.stocksign === '-' || row.stocksign === '-1' || row.stocksign === 'OUT') {
                direction = 'OUT';
            }

            await prisma.movementType.upsert({
                where: { movementTypeCode: row.movementtypecode },
                update: {
                    movementTypeName: row.movementtypename || row.movementtypecode,
                    direction: direction,
                    status: row.status || 'ACTIVE',
                },
                create: {
                    movementTypeCode: row.movementtypecode,
                    movementTypeName: row.movementtypename || row.movementtypecode,
                    direction: direction,
                    status: row.status || 'ACTIVE',
                },
            });
            stats.movementTypes.migrated++;
        } catch (e) {
            console.error(`  ❌ MovementType ${row.movementtypecode}:`, e.message.substring(0, 80));
            stats.movementTypes.errors++;
        }
    }
    console.log(`  ✅ Movement Types: ${stats.movementTypes.migrated}/${stats.movementTypes.total}`);
}

// =====================================
// 7. Migrate Document Types
// =====================================
async function migrateDocumentTypes() {
    console.log('\n📋 7. Migrating Document Types...');

    try {
        const { rows } = await legacyClient.query('SELECT * FROM documenttypes');
        stats.documentTypes.total = rows.length;

        for (const row of rows) {
            try {
                await prisma.documentType.upsert({
                    where: { docTypeCode: row.doctypecode },
                    update: {
                        docTypeName: row.doctypename || row.doctypecode,
                        movementType: row.movementtype || 'IN',
                        status: row.status || 'ACTIVE',
                    },
                    create: {
                        docTypeCode: row.doctypecode,
                        docTypeName: row.doctypename || row.doctypecode,
                        movementType: row.movementtype || 'IN',
                        status: row.status || 'ACTIVE',
                    },
                });
                stats.documentTypes.migrated++;
            } catch (e) {
                console.error(`  ❌ DocType ${row.doctypecode}:`, e.message.substring(0, 80));
                stats.documentTypes.errors++;
            }
        }
    } catch (e) {
        console.log('  ⚠️ documenttypes table not found, creating defaults...');
        // Create default document types
        const defaults = [
            { docTypeCode: 'GR', docTypeName: 'รับสินค้าเข้า', movementType: 'IN' },
            { docTypeCode: 'GI', docTypeName: 'จ่ายสินค้าออก', movementType: 'OUT' },
            { docTypeCode: 'TRN', docTypeName: 'โอนย้ายสินค้า', movementType: 'OUT' },
        ];
        stats.documentTypes.total = defaults.length;
        for (const dt of defaults) {
            await prisma.documentType.upsert({
                where: { docTypeCode: dt.docTypeCode },
                update: dt,
                create: { ...dt, status: 'ACTIVE' },
            });
            stats.documentTypes.migrated++;
        }
    }
    console.log(`  ✅ Document Types: ${stats.documentTypes.migrated}/${stats.documentTypes.total}`);
}

// =====================================
// 8. Migrate Products
// =====================================
async function migrateProducts() {
    console.log('\n📋 8. Migrating Products...');
    const { rows } = await legacyClient.query('SELECT * FROM products');
    stats.products.total = rows.length;

    let count = 0;
    for (const row of rows) {
        try {
            await prisma.product.upsert({
                where: { productCode: row.productcode },
                update: {
                    productName: row.productname || row.productcode,
                    principalProductCode: row.principalproductcode || null,
                    pieceBarcode: row.piecebarcode || null,
                    packBarcode: row.packbarcode || null,
                    innerBarcode: row.innerbarcode || null,
                    caseBarcode: row.casebarcode || null,
                    imgPath: row.imgpath || null,
                    shelfLife: parseInt(row.shelflife) || 0,
                    reorderPoint: parseInt(row.reorderpoint) || null,
                    slowMovingDay: parseInt(row.slowmovingday) || null,
                    mediumMovingDay: parseInt(row.mediummovingday) || null,
                    fastMovingDay: parseInt(row.fastmovingday) || null,
                    allowPartialIn: row.allowpartialin || 'YES',
                    allowPartialOut: row.allowpartialout || 'YES',
                    caseWeight: row.caseweight || 0,
                    caseWidth: row.casewidth || 0,
                    caseLength: row.caselength || 0,
                    caseHeight: row.caseheight || 0,
                    caseVolume: row.casevolume || 0,
                    stockControl: row.stockcontrol || 'FEFO',
                    maxMfgDays: parseInt(row.maxmfgdays) || 0,
                    allowMaxMfgDays: row.allowmaxmfgdays || null,
                    offsetDays: parseInt(row.offsetdays) || 0,
                    principalCode: row.principalcode || null,
                    brandCode: row.brandcode || null,
                    baseUomCode: row.baseuomcode || null,
                    status: row.status || 'ACTIVE',
                },
                create: {
                    productCode: row.productcode,
                    productName: row.productname || row.productcode,
                    principalProductCode: row.principalproductcode || null,
                    pieceBarcode: row.piecebarcode || null,
                    packBarcode: row.packbarcode || null,
                    innerBarcode: row.innerbarcode || null,
                    caseBarcode: row.casebarcode || null,
                    imgPath: row.imgpath || null,
                    shelfLife: parseInt(row.shelflife) || 0,
                    reorderPoint: parseInt(row.reorderpoint) || null,
                    slowMovingDay: parseInt(row.slowmovingday) || null,
                    mediumMovingDay: parseInt(row.mediummovingday) || null,
                    fastMovingDay: parseInt(row.fastmovingday) || null,
                    allowPartialIn: row.allowpartialin || 'YES',
                    allowPartialOut: row.allowpartialout || 'YES',
                    caseWeight: row.caseweight || 0,
                    caseWidth: row.casewidth || 0,
                    caseLength: row.caselength || 0,
                    caseHeight: row.caseheight || 0,
                    caseVolume: row.casevolume || 0,
                    stockControl: row.stockcontrol || 'FEFO',
                    maxMfgDays: parseInt(row.maxmfgdays) || 0,
                    allowMaxMfgDays: row.allowmaxmfgdays || null,
                    offsetDays: parseInt(row.offsetdays) || 0,
                    principalCode: row.principalcode || null,
                    brandCode: row.brandcode || null,
                    baseUomCode: row.baseuomcode || null,
                    status: row.status || 'ACTIVE',
                },
            });
            stats.products.migrated++;
            count++;
            if (count % 100 === 0) {
                console.log(`  ... ${count} products processed`);
            }
        } catch (e) {
            console.error(`  ❌ Product ${row.productcode}:`, e.message.substring(0, 100));
            stats.products.errors++;
        }
    }
    console.log(`  ✅ Products: ${stats.products.migrated}/${stats.products.total}`);
}

// =====================================
// Main Function
// =====================================
async function main() {
    console.log('='.repeat(70));
    console.log('🚀 Full Master Data Migration from Legacy System');
    console.log('='.repeat(70));
    console.log('Source: siripro-stock @ 192.168.10.15');
    console.log('Target: New SPWMS System');
    console.log('='.repeat(70));

    try {
        await legacyClient.connect();
        console.log('✅ Connected to legacy database');

        // Run migrations in order (dependencies first)
        await migratePrincipals();
        await migrateBrands();
        await migrateBranches();
        await migrateWarehouses();
        await migrateUsers();
        await migrateMovementTypes();
        await migrateDocumentTypes();
        await migrateProducts();

        // Summary
        console.log('\n' + '='.repeat(70));
        console.log('📊 Migration Summary');
        console.log('='.repeat(70));
        console.table(stats);

        // Calculate totals
        const totalMigrated = Object.values(stats).reduce((sum, s) => sum + s.migrated, 0);
        const totalErrors = Object.values(stats).reduce((sum, s) => sum + s.errors, 0);

        console.log(`\n✅ Total Migrated: ${totalMigrated} records`);
        if (totalErrors > 0) {
            console.log(`⚠️ Total Errors: ${totalErrors} records`);
        }
        console.log('\n🎉 Migration completed!');

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error(error);
    } finally {
        await legacyClient.end();
        await prisma.$disconnect();
    }
}

main();
