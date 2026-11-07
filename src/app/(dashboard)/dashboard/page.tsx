import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Package,
    Warehouse,
    ArrowDownToLine,
    ArrowUpFromLine,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    FileEdit,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { StockExpiryAlerts } from "@/components/dashboard/stock-expiry-alerts";
import {
    dashboardByPostdate,
    monthRange,
    todayRange,
} from "@/lib/dashboard";
import { Button } from "@/components/ui/button";

async function getDashboardStats() {
    const [totalProducts, totalWarehouses, totalStock, pendingTransactions] =
        await Promise.all([
            prisma.product.count({ where: { status: "ACTIVE" } }),
            prisma.warehouse.count({ where: { status: "ACTIVE" } }),
            prisma.stock.aggregate({ _sum: { qty: true } }),
            prisma.transactionHeader.count({ where: { docStatus: "DRAFT" } }),
        ]);

    return {
        totalProducts,
        totalWarehouses,
        totalStock: Number(totalStock._sum.qty || 0),
        pendingTransactions,
    };
}

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ fromdate?: string; todate?: string; range?: string }>;
}) {
    const session = await auth();
    const params = await searchParams;
    const preset =
        params.range === "today"
            ? todayRange()
            : params.fromdate && params.todate
              ? { fromdate: params.fromdate, todate: params.todate }
              : monthRange();

    const [stats, postdate] = await Promise.all([
        getDashboardStats(),
        dashboardByPostdate(preset.fromdate, preset.todate),
    ]);

    const statCards = [
        {
            title: "สินค้าทั้งหมด",
            value: stats.totalProducts.toLocaleString(),
            icon: Package,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
        },
        {
            title: "คลังสินค้า",
            value: stats.totalWarehouses.toLocaleString(),
            icon: Warehouse,
            color: "text-purple-600",
            bgColor: "bg-purple-100",
        },
        {
            title: "ยอดคงคลังรวม",
            value: stats.totalStock.toLocaleString(),
            icon: TrendingUp,
            color: "text-green-600",
            bgColor: "bg-green-100",
        },
        {
            title: "รอดำเนินการ (ทั้งหมด)",
            value: stats.pendingTransactions.toLocaleString(),
            icon: AlertTriangle,
            color: "text-orange-600",
            bgColor: "bg-orange-100",
        },
    ];

    const postCards = [
        {
            title: "ร่าง (DRAFT)",
            value: postdate.counts.DRAFT,
            href: "/documents?status=DRAFT",
            icon: AlertTriangle,
            color: "text-yellow-700",
            bg: "bg-yellow-50",
        },
        {
            title: "อนุมัติแล้ว",
            value: postdate.counts.APPROVED,
            href: "/documents?status=APPROVED",
            icon: CheckCircle2,
            color: "text-green-700",
            bg: "bg-green-50",
        },
        {
            title: "ยกเลิก",
            value: postdate.counts.CANCELLED,
            href: "/documents?status=CANCELLED",
            icon: XCircle,
            color: "text-red-700",
            bg: "bg-red-50",
        },
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        ยินดีต้อนรับ, {session?.user?.name || session?.user?.userId}
                    </h1>
                    <p className="text-slate-500">
                        สรุปเอกสารตามวันที่มีผลสต็อก · {postdate.fromdate} ถึง {postdate.todate}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        asChild
                        variant={!params.range && !params.fromdate ? "default" : "outline"}
                        size="sm"
                    >
                        <Link href="/dashboard">เดือนปัจจุบัน</Link>
                    </Button>
                    <Button
                        asChild
                        variant={params.range === "today" ? "default" : "outline"}
                        size="sm"
                    >
                        <Link href="/dashboard?range=today">วันปัจจุบัน</Link>
                    </Button>
                </div>
            </div>

            <form className="flex flex-col gap-2 rounded-lg border bg-white p-4 shadow-sm sm:flex-row sm:items-end dark:bg-slate-950">
                <div>
                    <label htmlFor="fromdate" className="mb-1 block text-sm font-medium">
                        จากวันที่
                    </label>
                    <input
                        id="fromdate"
                        name="fromdate"
                        type="date"
                        defaultValue={preset.fromdate}
                        className="flex h-9 rounded-md border px-3 text-sm"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="todate" className="mb-1 block text-sm font-medium">
                        ถึงวันที่
                    </label>
                    <input
                        id="todate"
                        name="todate"
                        type="date"
                        defaultValue={preset.todate}
                        className="flex h-9 rounded-md border px-3 text-sm"
                        required
                    />
                </div>
                <Button type="submit" size="sm">
                    เลือกช่วงวันที่
                </Button>
            </form>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {postCards.map((c) => (
                    <Link key={c.title} href={c.href}>
                        <Card className={`border-0 shadow-sm transition-colors hover:ring-2 hover:ring-slate-200 ${c.bg}`}>
                            <CardContent className="flex items-center justify-between p-6">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">{c.title}</p>
                                    <p className="mt-1 text-3xl font-bold tabular-nums">{c.value}</p>
                                </div>
                                <c.icon className={`h-8 w-8 ${c.color}`} />
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => (
                    <Card key={stat.title} className="border-0 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                                        {stat.value}
                                    </p>
                                </div>
                                <div className={`rounded-xl p-3 ${stat.bgColor}`}>
                                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <StockExpiryAlerts />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <ArrowDownToLine className="h-5 w-5 text-green-600" />
                            รับสินค้าเข้า
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Link
                            href="/transactions/receive"
                            className="inline-flex w-full items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                        >
                            ดูรายการรับสินค้า
                        </Link>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <ArrowUpFromLine className="h-5 w-5 text-orange-600" />
                            จ่ายสินค้าออก
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Link
                            href="/transactions/issue"
                            className="inline-flex w-full items-center justify-center rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
                        >
                            ดูรายการจ่ายสินค้า
                        </Link>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <ArrowDownToLine className="h-5 w-5 rotate-90 text-blue-600" />
                            โอนย้ายสินค้า
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Link
                            href="/transactions/transfer"
                            className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            ดูรายการโอนย้าย
                        </Link>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileEdit className="h-5 w-5 text-violet-600" />
                            ปรับปรุงสต็อก
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Link
                            href="/transactions/adjust"
                            className="inline-flex w-full items-center justify-center rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
                        >
                            ดูรายการปรับปรุง
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
