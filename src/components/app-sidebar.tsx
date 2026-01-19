"use client";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    LayoutDashboard,
    Package,
    Warehouse,
    ArrowDownToLine,
    ArrowUpFromLine,
    ArrowLeftRight,
    FileText,
    BarChart3,
    Settings,
    LogOut,
    Users,
    Ruler,
    Building2,
    FileType,
    Database,
    User,
    ArrowRightLeft,
    FileEdit,
    Activity,
    PackageSearch,
    History,
    CalendarDays,
    CreditCard,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface AppSidebarProps {
    user: {
        name?: string | null;
        userId: string;
        role: number;
    };
}

const menuItems = [
    {
        title: "หน้าหลัก",
        items: [
            { title: "แดชบอร์ด", icon: LayoutDashboard, href: "/dashboard" },
            { title: "โปรไฟล์", icon: User, href: "/dashboard/profile" },
        ],
    },
    {
        title: "ธุรกรรม",
        items: [
            { title: "รับสินค้า", icon: ArrowDownToLine, href: "/transactions/receive" },
            { title: "จ่ายสินค้า", icon: ArrowUpFromLine, href: "/transactions/issue" },
            { title: "โอนย้าย", icon: ArrowLeftRight, href: "/transactions/transfer" },
            { title: "เอกสาร", icon: FileText, href: "/documents" },
        ],
    },
    {
        title: "รายงาน",
        items: [
            { title: "ยอดคงคลัง", icon: PackageSearch, href: "/reports/stock-balance" },
            { title: "การเคลื่อนไหว", icon: History, href: "/reports/stock-movement" },
            // { title: "สต็อกการ์ด", icon: CreditCard, href: "/reports/stock-card" }, // ซ่อนไว้ก่อน
            { title: "สต็อกการ์ด (MFG/EXP)", icon: CalendarDays, href: "/reports/stock-card-detail" },
        ],
    },

];

const adminMenuItems = [
    {
        title: "Master Data",
        items: [
            { title: "คลังสินค้า", icon: Warehouse, href: "/master/warehouses" },
            { title: "สินค้า", icon: Package, href: "/master/products" },
            { title: "หน่วยนับ (UOM)", icon: Ruler, href: "/master/uom" },
            { title: "ผู้ผลิต", icon: Building2, href: "/master/principal" },
            { title: "ประเภทการเคลื่อนไหว", icon: ArrowRightLeft, href: "/master/movement-type" },
            { title: "ประเภทเอกสาร", icon: FileType, href: "/master/document-type" },
        ],
    },
    {
        title: "ระบบ",
        items: [
            { title: "ผู้ใช้งาน", icon: Users, href: "/users" },
            { title: "ประวัติการทำงาน", icon: Activity, href: "/logs" },
            { title: "Data Migration", icon: Database, href: "/admin/migrate" },
            { title: "ตั้งค่า", icon: Settings, href: "/settings" },
        ],
    },
];


export function AppSidebar({ user }: AppSidebarProps) {
    const pathname = usePathname();
    const isAdmin = user.role >= 7;

    const handleLogout = () => {
        signOut({ callbackUrl: "/login" });
    };

    return (
        <Sidebar className="border-r border-slate-200 dark:border-slate-700">
            <SidebarHeader className="border-b border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Package className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-slate-900 dark:text-white">SP WMS</h1>
                        <p className="text-xs text-slate-500">ระบบจัดการคลังสินค้า</p>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent className="px-2">
                {menuItems.map((group) => (
                    <SidebarGroup key={group.title}>
                        <SidebarGroupLabel className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                            {group.title}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === item.href}
                                            className="data-[active=true]:bg-blue-50 data-[active=true]:text-blue-600 dark:data-[active=true]:bg-blue-900/20"
                                        >
                                            <Link href={item.href}>
                                                <item.icon className="w-4 h-4" />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}

                {isAdmin && adminMenuItems.map((group) => (
                    <SidebarGroup key={group.title}>
                        <SidebarGroupLabel className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                            {group.title}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === item.href}
                                            className="data-[active=true]:bg-blue-50 data-[active=true]:text-blue-600 dark:data-[active=true]:bg-blue-900/20"
                                        >
                                            <Link href={item.href}>
                                                <item.icon className="w-4 h-4" />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/profile" className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                                {user.name?.charAt(0) || user.userId.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                {user.name || user.userId}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                                {user.userId}
                            </p>
                        </div>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="ออกจากระบบ"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
