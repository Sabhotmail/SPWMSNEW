import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { exec } from 'child_process';
import { promisify } from 'util';
import bcrypt from 'bcryptjs';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

// GET - Check migration status
export async function GET(request: NextRequest) {
    const session = await auth();

    if (!session || session.user.role < 7) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if migration has been run by checking data count
    try {
        const transactionCount = await prisma.transactionHeader.count();
        const productCount = await prisma.product.count();
        const stockCount = await prisma.stock.count();

        return NextResponse.json({
            status: 'success',
            migrated: transactionCount > 0 || productCount > 0,
            counts: {
                transactions: transactionCount,
                products: productCount,
                stocks: stockCount,
            },
        });
    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json({
            error: 'Failed to check migration status',
            message: err.message
        }, { status: 500 });
    }
}

// POST - Run migration
export async function POST(request: NextRequest) {
    const session = await auth();

    if (!session || session.user.role < 7) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, clean, connection, confirmPassword } = body;

    if (action !== 'migrate') {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Verify password before proceeding
    if (!confirmPassword) {
        return NextResponse.json({ error: 'กรุณาระบุรหัสผ่านเพื่อยืนยัน' }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { userId: session.user.userId }
        });

        if (!user) {
            return NextResponse.json({ error: 'ไม่พบข้อมูลผู้ใช้งาน' }, { status: 404 });
        }

        const isValid = await bcrypt.compare(confirmPassword, user.password);
        if (!isValid) {
            return NextResponse.json({ error: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 });
        }

        // Overwrite legacy DB env variables for this execution
        const env = {
            ...process.env,
            LEGACY_DB_HOST: connection?.host || process.env.LEGACY_DB_HOST,
            LEGACY_DB_PORT: connection?.port || process.env.LEGACY_DB_PORT,
            LEGACY_DB_NAME: connection?.database || process.env.LEGACY_DB_NAME,
            LEGACY_DB_USER: connection?.user || process.env.LEGACY_DB_USER,
            LEGACY_DB_PASSWORD: connection?.password || process.env.LEGACY_DB_PASSWORD,
        };

        // Run migration script
        const cleanFlag = clean ? '--clean' : '';
        const command = `node migrate-full.js ${cleanFlag}`;

        console.log(`Running migration: ${command} with custom connection`);

        const { stdout, stderr } = await execAsync(command, {
            cwd: process.cwd(),
            env, // Pass the environment variables here
            timeout: 600000, // 10 minutes timeout for large data
        });

        return NextResponse.json({
            status: 'success',
            message: 'Migration completed successfully',
            output: stdout,
            errors: stderr,
        });
    } catch (error: unknown) {
        const err = error as Error & { stdout?: string; stderr?: string };
        console.error('Migration error:', err);

        return NextResponse.json({
            status: 'error',
            message: 'Migration failed',
            error: err.message,
            output: err.stdout || '',
            errors: err.stderr || '',
        }, { status: 500 });
    }
}
