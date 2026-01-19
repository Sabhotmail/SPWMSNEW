/**
 * Production Database Setup Script
 * Creates the production database and runs migrations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m'
};

const log = {
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`)
};

async function main() {
    console.log('\n🚀 Production Database Setup\n');

    // Check if .env.production exists
    const envPath = path.join(__dirname, '..', '.env.production');
    if (!fs.existsSync(envPath)) {
        log.error('.env.production not found!');
        log.info('Please run: node deployment/setup-env.js');
        process.exit(1);
    }

    log.info('Using .env.production for configuration');

    try {
        // Step 1: Generate Prisma Client
        log.info('Step 1: Generating Prisma Client...');
        execSync('npx prisma generate', {
            stdio: 'inherit',
            env: { ...process.env, DATABASE_URL: getProductionDbUrl() }
        });
        log.success('Prisma Client generated');

        // Step 2: Push database schema (creates DB if not exists)
        log.info('Step 2: Creating database and pushing schema...');
        log.warning('This will create the database if it doesn\'t exist');

        execSync('npx prisma db push --accept-data-loss', {
            stdio: 'inherit',
            env: {
                ...process.env,
                DATABASE_URL: getProductionDbUrl().replace('spwms_production', 'postgres')
            }
        });

        // Step 3: Run migrations
        log.info('Step 3: Running migrations...');
        execSync('npx prisma migrate deploy', {
            stdio: 'inherit',
            env: { ...process.env, DATABASE_URL: getProductionDbUrl() }
        });
        log.success('Migrations applied');

        // Step 4: Verify
        log.info('Step 4: Verifying database...');
        execSync('npx prisma db pull', {
            stdio: 'pipe',
            env: { ...process.env, DATABASE_URL: getProductionDbUrl() }
        });
        log.success('Database verified successfully!');

        console.log('\n✅ Production database setup complete!\n');
        log.info('Next steps:');
        console.log('  1. Seed data (optional): npm run db:seed');
        console.log('  2. Build application: npm run build');
        console.log('  3. Start production: npm start\n');

    } catch (error) {
        log.error('Setup failed!');
        console.error(error.message);
        process.exit(1);
    }
}

function getProductionDbUrl() {
    // Read from .env.production
    const envPath = path.join(__dirname, '..', '.env.production');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/DATABASE_URL="(.+)"/);

    if (!match) {
        throw new Error('DATABASE_URL not found in .env.production');
    }

    return match[1];
}

main().catch(console.error);
