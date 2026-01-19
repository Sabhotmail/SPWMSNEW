import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { MobileHeader } from "@/components/mobile-header";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-900">
                <AppSidebar user={session.user} />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <MobileHeader />
                    <main className="flex-1 overflow-auto">
                        {children}
                    </main>
                </div>
            </div>
            <Toaster />
        </SidebarProvider>
    );
}
