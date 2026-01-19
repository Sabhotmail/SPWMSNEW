// Migration script to production Docker database
const { Client } = require('pg');
const { PrismaClient } = require('@prisma/client');

// Production database URL
const DATABASE_URL = 'postgresql://spwms_user:CHANGE_THIS_TO_SECURE_PASSWORD@localhost:5432/spwms_production?schema=public';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: DATABASE_URL
        }
    }
});

// Legacy database configuration
const legacyConfig = {
    host: '192.168.42.10',
    port: 5432,
    database: 'siripro-stock',
    user: 'postgres',
    password: 'S1r1Pr0',
};

async function runMigration() {
    console.log('🚀 Starting migration to Docker production database...');
    console.log(`📊 Target: spwms_production@localhost:5432\n`);

    // รันคำสั่ง migration
    const { execSync } = require('child_process');

    // Set environment และรัน migrate-full.js
    process.env.DATABASE_URL = DATABASE_URL;

    try {
        // เรียกใช้ migration script หลัก
        require('./migrate-full.js');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
