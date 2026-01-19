"use client";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileHeader() {
    const { openMobile, isMobile, state, toggleSidebar } = useSidebar();

    // แสดงจนถึงหน้าจอ 1280px (xl)
    return (
        <div className="xl:hidden sticky top-0 z-40 flex items-center h-14 px-4 bg-white/80 backdrop-blur-md border-b border-slate-200 dark:bg-slate-900/80 dark:border-slate-700">
            <button
                onClick={toggleSidebar}
                className="p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle Menu"
            >
                {openMobile ? (
                    <X className="w-6 h-6" />
                ) : (
                    <Menu className="w-6 h-6" />
                )}
            </button>

            <div className="flex items-center gap-2 ml-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">SP</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">SP WMS</span>
            </div>
        </div>
    );
}
