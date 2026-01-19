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
        console.log('Connected to old database');

        // Query products and their UOM counts
        const query = `
      SELECT p.productcode, p.productname, COUNT(pu.id) as uom_count, string_agg(pu.uomcode, ', ') as uoms
      FROM products p
      LEFT JOIN productuoms pu ON p.productcode = pu.productcode
      GROUP BY p.productcode, p.productname
      HAVING COUNT(pu.id) < 3
      ORDER BY p.productcode;
    `;

        const res = await client.query(query);

        console.log('Products with less than 3 UOMs in old system:');
        res.rows.forEach(row => {
            console.log(`- [${row.productcode}] ${row.productname}: ${row.uoms || 'None'} (${row.uom_count} UOMs)`);
        });

    } catch (err) {
        console.error('Error connecting to old database:', err);
    } finally {
        await client.end();
    }
}

main();
