import { Client } from 'pg';

async function main() {
    const oldClient = new Client({
        user: 'postgres', host: '127.0.0.1', password: 'S1r1Pr0', port: 5432, database: 'siripro-stock'
    });
    const newClient = new Client({
        user: 'postgres', host: '127.0.0.1', password: 'S1r1Pr0', port: 5432, database: 'spwms_new'
    });

    try {
        await oldClient.connect();
        await newClient.connect();

        console.log('Comparing Database Counts (Old System -> New System)');
        console.log('---------------------------------------------------');

        const tables = [
            { old: 'products', new: 'products' },
            { old: 'uoms', new: 'uoms' },
            { old: 'productuoms', new: 'product_uoms' },
            { old: 'documenttypes', new: 'document_types' },
            { old: 'movementtypes', new: 'movement_types' },
            { old: 'branches', new: 'branches' },
            { old: 'principals', new: 'principals' },
            { old: 'warehouses', new: 'warehouses' },
            { old: 'locations', new: 'locations' },
            { old: 'users', new: 'users' }
        ];

        for (const t of tables) {
            const oldRes = await oldClient.query(`SELECT COUNT(*) FROM "${t.old}"`).catch(() => ({ rows: [{ count: 'N/A' }] }));
            const newRes = await newClient.query(`SELECT COUNT(*) FROM "${t.new}"`).catch(() => ({ rows: [{ count: 'N/A' }] }));

            console.log(`${t.new.padEnd(20)}: Old(${oldRes.rows[0].count}) -> New(${newRes.rows[0].count})`);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await oldClient.end();
        await newClient.end();
    }
}

main();
