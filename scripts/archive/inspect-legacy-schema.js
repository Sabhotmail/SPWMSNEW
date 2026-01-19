const { Client } = require('pg');
require('dotenv').config();

const legacyConfig = {
    host: process.env.LEGACY_DB_HOST || '192.168.10.15',
    port: parseInt(process.env.LEGACY_DB_PORT) || 5432,
    database: process.env.LEGACY_DB_NAME || 'siripro-stock',
    user: process.env.LEGACY_DB_USER || 'postgres',
    password: process.env.LEGACY_DB_PASSWORD || 'S1r1Pr0',
};

async function inspectSchema() {
    const legacy = new Client(legacyConfig);
    try {
        await legacy.connect();
        const tables = ['stocks', 'transaction_headers', 'transaction_details', 'documenttypes'];

        for (const table of tables) {
            console.log(`\n--- Columns in table: ${table} ---`);
            const res = await legacy.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = $1
                ORDER BY ordinal_position
            `, [table]);
            console.log(res.rows.map(r => r.column_name).join(', '));
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await legacy.end();
    }
}

inspectSchema();
