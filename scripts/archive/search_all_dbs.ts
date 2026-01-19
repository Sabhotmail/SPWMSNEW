import { Client } from 'pg';

const dbs = [
    'postgres', 'helpdesk', 'salesgps', 'Parcel', 'itasset', 'tablet',
    'inventory_db', 'ithelpdesk', 'it_support', 'it_ticketing', 'ricohdb',
    'gps', 'siripro-stock', 'spwms_new', 'it_helpdesk'
];

async function checkDb(dbName: string) {
    const client = new Client({
        user: 'postgres', host: '127.0.0.1', password: 'S1r1Pr0', port: 5432,
        database: dbName
    });

    try {
        await client.connect();
        // Check if products table exists
        const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'products'
      );
    `);

        if (tableCheck.rows[0].exists) {
            const count = await client.query('SELECT COUNT(*) FROM products');
            const uomCount = await client.query('SELECT COUNT(*) FROM productuoms');
            console.log(`- Database [${dbName}] has products: ${count.rows[0].count}, UOMs: ${uomCount.rows[0].count}`);
        }
    } catch (err) {
        // console.log(`- Database [${dbName}] error: ${err.message}`);
    } finally {
        await client.end();
    }
}

async function main() {
    console.log('Searching for products table in all databases:');
    for (const db of dbs) {
        await checkDb(db);
    }
}

main();
