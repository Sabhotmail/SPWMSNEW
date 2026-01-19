#!/usr/bin/env node

/**
 * Production Environment Setup Script
 * This script helps you configure production environment variables
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    red: '\x1b[31m'
};

const log = {
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`)
};

async function main() {
    console.clear();
    log.header('🚀 SPWMS Production Environment Setup');

    log.info('This script will help you create the .env.production file');
    log.warning('Make sure you have the following information ready:');
    console.log('  - Production database credentials');
    console.log('  - Production domain or server IP');
    console.log('');

    const proceed = await question('Continue? (y/n): ');
    if (proceed.toLowerCase() !== 'y') {
        log.info('Setup cancelled');
        rl.close();
        return;
    }

    // Generate AUTH_SECRET
    log.header('📝 Step 1: Authentication Secret');
    const authSecret = crypto.randomBytes(32).toString('base64');
    log.success(`Generated AUTH_SECRET: ${colors.bright}${authSecret}${colors.reset}`);
    console.log('');

    // Database Configuration
    log.header('💾 Step 2: Database Configuration');
    const dbHost = await question('Database Host (default: localhost): ') || 'localhost';
    const dbPort = await question('Database Port (default: 5432): ') || '5432';
    const dbName = await question('Database Name (default: spwms_production): ') || 'spwms_production';
    const dbUser = await question('Database User (default: spwms_user): ') || 'spwms_user';
    const dbPassword = await question('Database Password: ');

    if (!dbPassword) {
        log.error('Database password is required!');
        rl.close();
        return;
    }

    const databaseUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=public`;
    console.log('');

    // Application URL
    log.header('🌐 Step 3: Application URL');
    log.info('Enter your production URL:');
    console.log('  Examples:');
    console.log('    - https://wms.yourdomain.com');
    console.log('    - http://192.168.1.100:3000');
    const nextAuthUrl = await question('Production URL: ');

    if (!nextAuthUrl) {
        log.error('Production URL is required!');
        rl.close();
        return;
    }
    console.log('');

    // Legacy Database (optional)
    log.header('🗄️  Step 4: Legacy Database (Optional)');
    const useLegacy = await question('Do you need legacy database connection? (y/n): ');

    let legacyConfig = '';
    if (useLegacy.toLowerCase() === 'y') {
        const legacyHost = await question('Legacy DB Host: ');
        const legacyPort = await question('Legacy DB Port (default: 5432): ') || '5432';
        const legacyName = await question('Legacy DB Name: ');
        const legacyUser = await question('Legacy DB User: ');
        const legacyPassword = await question('Legacy DB Password: ');

        legacyConfig = `
# =============================================================================
# LEGACY DATABASE CONFIGURATION
# =============================================================================
LEGACY_DB_HOST=${legacyHost}
LEGACY_DB_PORT=${legacyPort}
LEGACY_DB_NAME=${legacyName}
LEGACY_DB_USER=${legacyUser}
LEGACY_DB_PASSWORD=${legacyPassword}`;
    }

    // Generate .env.production file
    const envContent = `# Production Environment Variables
# ⚠️ WARNING: Do NOT commit this file to version control!
# Generated: ${new Date().toISOString()}

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
DATABASE_URL="${databaseUrl}"

# =============================================================================
# NEXTAUTH CONFIGURATION
# =============================================================================
AUTH_SECRET="${authSecret}"
NEXTAUTH_URL="${nextAuthUrl}"

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================
NEXT_PUBLIC_APP_NAME="SP WMS"
NEXT_PUBLIC_APP_VERSION="2.0.0"
NODE_ENV=production
PORT=3000${legacyConfig}

# =============================================================================
# IMPORTANT NOTES:
# =============================================================================
# - Keep this file secure and never commit it to version control
# - Make sure to backup this file in a secure location
# - Use strong passwords for production databases
# - Enable SSL/HTTPS in production
# =============================================================================
`;

    const envPath = path.join(__dirname, '.env.production');

    // Check if file exists
    if (fs.existsSync(envPath)) {
        log.warning('.env.production already exists!');
        const overwrite = await question('Overwrite? (y/n): ');
        if (overwrite.toLowerCase() !== 'y') {
            log.info('Setup cancelled - file not modified');
            rl.close();
            return;
        }
    }

    // Write file
    fs.writeFileSync(envPath, envContent);
    log.header('✅ Setup Complete!');
    log.success(`.env.production created successfully at: ${envPath}`);
    console.log('');

    log.info('Configuration Summary:');
    console.log(`  Database: ${colors.bright}${dbUser}@${dbHost}:${dbPort}/${dbName}${colors.reset}`);
    console.log(`  URL: ${colors.bright}${nextAuthUrl}${colors.reset}`);
    console.log(`  Legacy DB: ${colors.bright}${useLegacy.toLowerCase() === 'y' ? 'Yes' : 'No'}${colors.reset}`);
    console.log('');

    log.header('📋 Next Steps:');
    console.log('  1. Review the .env.production file');
    console.log('  2. Test database connection: npx prisma db pull');
    console.log('  3. Run migrations: npx prisma migrate deploy');
    console.log('  4. Build application: npm run build');
    console.log('  5. Deploy to production server');
    console.log('');

    log.warning('Security Reminders:');
    console.log('  ⚠  Never commit .env.production to version control');
    console.log('  ⚠  Keep database passwords secure');
    console.log('  ⚠  Use HTTPS in production');
    console.log('  ⚠  Enable firewall on production server');
    console.log('');

    rl.close();
}

main().catch(console.error);
