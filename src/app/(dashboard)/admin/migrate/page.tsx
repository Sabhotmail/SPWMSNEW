import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import MigrationClient from './migration-client';

export default async function DataMigrationPage() {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    if (session.user.role < 7) {
        redirect('/dashboard');
    }

    return <MigrationClient />;
}
