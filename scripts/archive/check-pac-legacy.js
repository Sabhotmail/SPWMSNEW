const { Client } = require('pg');

const client = new Client({
    host: '192.168.10.15',
    port: 5432,
    database: 'siripro-stock',
    user: 'postgres',
    password: 'S1r1Pr0',
});

async function main() {
    try {
        await client.connect();

        const pacUsage = await client.query(`
            SELECT count(*) 
            FROM productuoms 
            WHERE uomcode = 'PAC'
        `);
        console.log('Legacy PAC usage count:', pacUsage.rows[0].count);

        const examplePac = await client.query(`
            SELECT productcode, uomcode, uomratio 
            FROM productuoms 
            WHERE uomcode = 'PAC'
            LIMIT 5
        `);
        console.table(examplePac.rows);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.end();
    }
}

main();
