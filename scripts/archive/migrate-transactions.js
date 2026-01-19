// Script สำหรับ Migrate เอกสารธุรกรรม (Transaction Headers & Details) จากระบบเดิม
// รันด้วย: node migrate-transactions.js

const { Client } = require('pg');
const { PrismaClient } = require('@prisma/client');

const legacyClient = new Client({
    host: '192.168.10.15',
    port: 5432,
    database: 'siripro-stock',
    user: 'postgres',
    password: 'S1r1Pr0',
});

const prisma = new PrismaClient();

const stats = {
    headers: { total: 0, migrated: 0, skipped: 0, errors: 0 },
    details: { total: 0, migrated: 0, skipped: 0, errors: 0 },
};

// =====================================
// 1. Get Legacy Schema Info
// =====================================
async function getColumnNames(tableName) {
    const { rows } = await legacyClient.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1
    `, [tableName]);
    return rows.map(r => r.column_name);
}

// =====================================
// 2. Migrate Transaction Headers
// =====================================
async function migrateTransactionHeaders() {
    console.log('\n📋 1. Migrating Transaction Headers...');

    // Get column info first
    const columns = await getColumnNames('transaction_headers');
    console.log('  Available columns:', columns.slice(0, 10).join(', '), '...');

    const { rows } = await legacyClient.query(`
        SELECT * FROM transaction_headers ORDER BY id
    `);
    stats.headers.total = rows.length;
    console.log(`  Found ${rows.length} transaction headers`);

    let count = 0;
    for (const row of rows) {
        try {
            // Check if user exists
            const userExists = await prisma.user.findUnique({
                where: { userId: row.createdby || 'ADMIN' }
            });

            // Check if warehouse exists
            const whExists = await prisma.warehouse.findUnique({
                where: { whCode: row.whcode }
            });

            // Check if document type exists
            const docTypeExists = await prisma.documentType.findUnique({
                where: { docTypeCode: row.doctypecode }
            });

            if (!whExists || !docTypeExists) {
                stats.headers.skipped++;
                continue;
            }

            // Map docstate to docStatus (legacy uses docstate)
            let docStatus = 'DRAFT';
            if (row.docstate === 'APPROVED' || row.docstate === 'CLOSED') {
                docStatus = 'APPROVED';
            } else if (row.docstate === 'CANCELLED') {
                docStatus = 'CANCELLED';
            }

            await prisma.transactionHeader.upsert({
                where: { docNo: row.docno },
                update: {
                    docTypeCode: row.doctypecode,
                    docDate: new Date(row.docdate),
                    postDate: new Date(row.postdate || row.docdate),
                    whCode: row.whcode,
                    locCode: row.loccode || null,
                    toWhCode: row.towhcode || null,
                    ref1: row.ref1 || null,
                    ref2: row.ref2 || null,
                    ref3: row.ref3 || null,
                    movementTypeCode: row.movementtypecode || null,
                    salesmanCode: row.salesmancode || null,
                    remark: row.remark || null,
                    docStatus: docStatus,
                    docState: row.docstate || 'OPEN',
                    createdUserName: row.createdusername || null,
                    updatedUserName: row.updatedusername || null,
                    updatedBy: row.updatedby || null,
                    approvedBy: row.approvedby || null,
                    approvedAt: row.approvedat ? new Date(row.approvedat) : null,
                },
                create: {
                    docNo: row.docno,
                    docTypeCode: row.doctypecode,
                    docDate: new Date(row.docdate),
                    postDate: new Date(row.postdate || row.docdate),
                    whCode: row.whcode,
                    locCode: row.loccode || null,
                    toWhCode: row.towhcode || null,
                    ref1: row.ref1 || null,
                    ref2: row.ref2 || null,
                    ref3: row.ref3 || null,
                    movementTypeCode: row.movementtypecode || null,
                    salesmanCode: row.salesmancode || null,
                    remark: row.remark || null,
                    docStatus: docStatus,
                    docState: row.docstate || 'OPEN',
                    createdUserName: row.createdusername || null,
                    updatedUserName: row.updatedusername || null,
                    createdBy: userExists ? row.createdby : 'ADMIN',
                    updatedBy: row.updatedby || null,
                    approvedBy: row.approvedby || null,
                    approvedAt: row.approvedat ? new Date(row.approvedat) : null,
                },
            });
            stats.headers.migrated++;
            count++;
            if (count % 500 === 0) {
                console.log(`  ... ${count} headers processed`);
            }
        } catch (e) {
            console.error(`  ❌ Header ${row.docno}:`, e.message.substring(0, 100));
            stats.headers.errors++;
        }
    }
    console.log(`  ✅ Headers: ${stats.headers.migrated}/${stats.headers.total} (skipped: ${stats.headers.skipped})`);
}

// =====================================
// 3. Migrate Transaction Details
// =====================================
async function migrateTransactionDetails() {
    console.log('\n📋 2. Migrating Transaction Details...');

    // Get all migrated headers first
    const migratedHeaders = await prisma.transactionHeader.findMany({
        select: { docNo: true }
    });
    const migratedDocNos = new Set(migratedHeaders.map(h => h.docNo));
    console.log(`  Found ${migratedDocNos.size} migrated headers to match`);

    // Get details grouped by docno to generate line numbers
    const { rows } = await legacyClient.query(`
        SELECT * FROM transaction_details ORDER BY docno, id
    `);
    stats.details.total = rows.length;
    console.log(`  Found ${rows.length} transaction details`);

    let count = 0;
    let currentDocNo = '';
    let lineNo = 0;

    for (const row of rows) {
        try {
            // Skip if header wasn't migrated
            if (!migratedDocNos.has(row.docno)) {
                stats.details.skipped++;
                continue;
            }

            // Generate line number (reset for each new document)
            if (currentDocNo !== row.docno) {
                currentDocNo = row.docno;
                lineNo = 1;
            } else {
                lineNo++;
            }

            // Check if product exists
            const productExists = await prisma.product.findUnique({
                where: { productCode: row.productcode }
            });

            if (!productExists) {
                stats.details.skipped++;
                continue;
            }

            // Check if warehouse exists
            const whExists = await prisma.warehouse.findUnique({
                where: { whCode: row.whcode }
            });

            if (!whExists) {
                stats.details.skipped++;
                continue;
            }

            await prisma.transactionDetail.upsert({
                where: {
                    docNo_lineNo: {
                        docNo: row.docno,
                        lineNo: lineNo,
                    }
                },
                update: {
                    productCode: row.productcode,
                    uomCode: row.uomcode || 'PCS',
                    uomQty: parseInt(row.uomqty) || 0,
                    uomRatio: parseInt(row.uomratio) || 1,
                    pieceQty: parseInt(row.pieceqty) || 0,
                    qty: row.uomqty || 0,
                    whCode: row.whcode,
                    locCode: row.loccode || '',
                    movementTypeCode: row.movementtypecode || null,
                    docState: row.docstate || 'WAIT',
                    recordType: row.recordtype || '0',
                    mfgDate: row.mfgdate ? new Date(row.mfgdate) : null,
                    expDate: row.expdate ? new Date(row.expdate) : null,
                    status: 'ACTIVE',
                },
                create: {
                    docNo: row.docno,
                    lineNo: lineNo,
                    productCode: row.productcode,
                    uomCode: row.uomcode || 'PCS',
                    uomQty: parseInt(row.uomqty) || 0,
                    uomRatio: parseInt(row.uomratio) || 1,
                    pieceQty: parseInt(row.pieceqty) || 0,
                    qty: row.uomqty || 0,
                    whCode: row.whcode,
                    locCode: row.loccode || '',
                    movementTypeCode: row.movementtypecode || null,
                    docState: row.docstate || 'WAIT',
                    recordType: row.recordtype || '0',
                    mfgDate: row.mfgdate ? new Date(row.mfgdate) : null,
                    expDate: row.expdate ? new Date(row.expdate) : null,
                    createdUserName: row.createdusername || null,
                    updatedUserName: row.updatedusername || null,
                    createdUserId: row.createduserid || null,
                    updatedUserId: row.updateduserid || null,
                    status: 'ACTIVE',
                },
            });
            stats.details.migrated++;
            count++;
            if (count % 5000 === 0) {
                console.log(`  ... ${count} details processed`);
            }
        } catch (e) {
            console.error(`  ❌ Detail ${row.docno}-${lineNo}:`, e.message.substring(0, 100));
            stats.details.errors++;
        }
    }
    console.log(`  ✅ Details: ${stats.details.migrated}/${stats.details.total} (skipped: ${stats.details.skipped})`);
}

// =====================================
// Main Function
// =====================================
async function main() {
    console.log('='.repeat(70));
    console.log('🚀 Transaction Documents Migration from Legacy System');
    console.log('='.repeat(70));
    console.log('Source: siripro-stock @ 192.168.10.15');
    console.log('Target: New SPWMS System');
    console.log('='.repeat(70));

    try {
        await legacyClient.connect();
        console.log('✅ Connected to legacy database');

        await migrateTransactionHeaders();
        await migrateTransactionDetails();

        // Summary
        console.log('\n' + '='.repeat(70));
        console.log('📊 Migration Summary');
        console.log('='.repeat(70));
        console.table(stats);

        const totalMigrated = stats.headers.migrated + stats.details.migrated;
        const totalErrors = stats.headers.errors + stats.details.errors;
        const totalSkipped = stats.headers.skipped + stats.details.skipped;

        console.log(`\n✅ Total Migrated: ${totalMigrated} records`);
        console.log(`⏭️ Total Skipped: ${totalSkipped} records (missing references)`);
        if (totalErrors > 0) {
            console.log(`⚠️ Total Errors: ${totalErrors} records`);
        }
        console.log('\n🎉 Transaction migration completed!');

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error(error);
    } finally {
        await legacyClient.end();
        await prisma.$disconnect();
    }
}

main();
