import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Package,
    Warehouse,
    ArrowDownToLine,
    ArrowUpFromLine,
    TrendingUp,
    AlertTriangle,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { StockExpiryAlerts } from "@/components/dashboard/stock-expiry-alerts";

async function getDashboardStats() {
    const [
        totalProducts,
        totalWarehouses,
        totalStock,
        pendingTransactions,
    ] = await Promise.all([
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

export default async function DashboardPage() {
    const session = await auth();
    const stats = await getDashboardStats();

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
            title: "รอดำเนินการ",
            value: stats.pendingTransactions.toLocaleString(),
            icon: AlertTriangle,
            color: "text-orange-600",
            bgColor: "bg-orange-100",
        },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    ยินดีต้อนรับ, {session?.user?.name || session?.user?.userId}
                </h1>
                <p className="text-slate-500">
                    ภาพรวมระบบจัดการคลังสินค้าของคุณ
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => (
                    <Card key={stat.title} className="border-0 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                        {stat.value}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Stock Expiry Warnings */}
            <StockExpiryAlerts />

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ArrowDownToLine className="w-5 h-5 text-green-600" />
                            รับสินค้าเข้า
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-500 text-sm mb-4">
                            บันทึกการรับสินค้าเข้าคลัง
                        </p>
                        <Link
                            href="/transactions/receive"
                            className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium w-full"
                        >
                            ดูรายการรับสินค้า
                        </Link>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ArrowUpFromLine className="w-5 h-5 text-orange-600" />
                            จ่ายสินค้าออก
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-500 text-sm mb-4">
                            บันทึกการจ่ายสินค้าออกจากคลัง
                        </p>
                        <Link
                            href="/transactions/issue"
                            className="inline-flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium w-full"
                        >
                            ดูรายการจ่ายสินค้า
                        </Link>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ArrowDownToLine className="w-5 h-5 text-blue-600 rotate-90" />
                            โอนย้ายสินค้า
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-500 text-sm mb-4">
                            บันทึกการโอนย้ายระหว่างคลัง
                        </p>
                        <Link
                            href="/transactions/transfer"
                            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium w-full"
                        >
                            ดูรายการโอนย้าย
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
