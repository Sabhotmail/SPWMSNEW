import { Client } from 'pg';

async function main() {
    const client = new Client({
        user: 'postgres',
        host: '127.0.0.1',
        database: 'siripro-stock',
        password: 'S1r1Pr0',
        port: 5432,
    });

    try {
        await client.connect();

        const productCount = await client.query('SELECT COUNT(*) FROM products');
        const uomCount = await client.query('SELECT COUNT(*) FROM productuoms');

        console.log(`Total Products: ${productCount.rows[0].count}`);
        console.log(`Total Product UOMs: ${uomCount.rows[0].count}`);

        const example = await client.query('SELECT productcode, productname FROM products LIMIT 5');
        console.log('Sample Products:');
        example.rows.forEach(r => console.log(`- ${r.productcode}: ${r.productname}`));

        const uomExample = await client.query('SELECT productcode, uomcode FROM productuoms LIMIT 5');
        console.log('Sample UOMs:');
        uomExample.rows.forEach(r => console.log(`- ${r.productcode}: ${r.uomcode}`));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

main();
