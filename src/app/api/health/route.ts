import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'SPWMS',
        version: process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0'
    });
}
