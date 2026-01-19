import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    CreditCard,
    Warehouse,
    FileSpreadsheet,
    ArrowLeft,
    Package,
    LayoutDashboard,
    Search,
    History,
    FileText,
} from "lucide-react";
import Link from "next/link";
import { WarehouseFilter } from "@/components/reports/warehouse-filter";

export const dynamic = "force-dynamic";

async function getStockCards(whCode?: string) {
    const where: any = {};
    if (whCode) {
        where.whCode = whCode;
    }

    // Get stock dates with product details
    const stockDates = await prisma.stockDate.findMany({
        where: {
            ...where,
            balance: { gt: 0 }
        },
        include: {
            product: {
                include: {
                    productUOMs: {
                        where: { status: "ACTIVE" },
                        orderBy: { uomRatio: "desc" },
                    },
                },
            },
        },
        orderBy: [
            { productCode: 'asc' },
            { expDate: 'asc' },
        ],
    });

    return stockDates.map(sd => ({
        ...sd,
        qty: Number(sd.balance),
    }));
}

async function getStockSummary(whCode?: string) {
    const where: any = {
        qty: { gt: 0 }
    };
    if (whCode) {
        where.whCode = whCode;
    }

    const stocks = await prisma.stock.findMany({
        where,
        include: {
            product: {
                include: {
                    productUOMs: {
                        where: { status: "ACTIVE" },
                        orderBy: { uomRatio: "desc" },
                    },
                },
            },
        },
        orderBy: { productCode: 'asc' },
    });

    return stocks.map(s => ({
        ...s,
        qty: Number(s.qty),
    }));
}

// Helper function to convert pieces to UOM breakdown
function convertToUOMBreakdown(totalPieces: number, uoms: Array<{ uomCode: string; uomRatio: number }>) {
    let remaining = totalPieces;
    const breakdown: Array<{ uomCode: string; qty: number }> = [];

    const sortedUoms = [...uoms].sort((a, b) => b.uomRatio - a.uomRatio);

    for (const uom of sortedUoms) {
        if (uom.uomRatio > 1 && remaining >= uom.uomRatio) {
            const qty = Math.floor(remaining / uom.uomRatio);
            breakdown.push({ uomCode: uom.uomCode, qty });
            remaining = remaining % uom.uomRatio;
        }
    }

    if (remaining > 0) {
        breakdown.push({ uomCode: "PCS", qty: remaining });
    }

    return breakdown;
}

function formatUOMBreakdown(totalPieces: number, uoms: Array<{ uomCode: string; uomRatio: number }>) {
    const breakdown = convertToUOMBreakdown(totalPieces, uoms);
    if (breakdown.length === 0) return "0 ชิ้น";

    const uomNames: Record<string, string> = {
        CTN: "ลัง",
        PAC: "แพ็ค",
        PCS: "ชิ้น",
    };

    return breakdown.map(b => `${b.qty} ${uomNames[b.uomCode] || b.uomCode}`).join(" + ");
}

async function getWarehouses() {
    return prisma.warehouse.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { seq: 'asc' },
    });
}

export default async function StockCardPage(props: {
    searchParams: Promise<{ whCode?: string; view?: string }>;
}) {
    await auth();
    const searchParams = await props.searchParams;
    const { view = 'summary' } = searchParams;
    const whCode = typeof searchParams.whCode === 'string' ? searchParams.whCode : undefined;

    // Default to a specific warehouse or first active if none selected
    const warehouses = await getWarehouses();
    const effectiveWhCode = whCode || (warehouses.length > 0 ? warehouses[0].whCode : '');

    const [stocks, stockCards] = await Promise.all([
        getStockSummary(effectiveWhCode),
        view === 'card' ? getStockCards(effectiveWhCode) : [],
    ]);

    const data = view === 'card' ? stockCards : stocks;

    // Summary Metrics
    const totalQty = data.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
    const uniqueSKUs = stocks.length;
    const selectedWarehouse = warehouses.find(w => w.whCode === effectiveWhCode);

    return (
        <div className="p-6 space-y-6">
            {/* Header & Main Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/reports/stock-balance">
                        <Button variant="outline" size="icon" className="rounded-full shadow-sm">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <History className="w-7 h-7 text-indigo-600" />
                            สต็อกการ์ด (Stock Card)
                        </h1>
                        <p className="text-slate-500">ตรวจสอบความเคลื่อนไหวและยอดคงเหลือรายล็อต</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50 shadow-sm">
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        ส่งออก Excel
                    </Button>
                </div>
            </div>

            {/* Summary Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-indigo-100 shadow-lg">
                                <Package className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">จำนวนสินค้าที่มีสต๊อก</p>
                                <p className="text-2xl font-bold text-indigo-950 dark:text-white">
                                    {uniqueSKUs.toLocaleString()} <span className="text-sm font-normal text-slate-400">รายการ</span>
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white dark:from-slate-900">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-blue-100 shadow-lg">
                                <LayoutDashboard className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">จำนวนรวมทั้งหมด</p>
                                <p className="text-2xl font-bold text-blue-950 dark:text-white">
                                    {totalQty.toLocaleString()} <span className="text-sm font-normal text-slate-400">ชิ้น</span>
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-white dark:from-slate-900">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-purple-600 text-white shadow-purple-100 shadow-lg">
                                <Warehouse className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">คลังสินค้าที่เลือก</p>
                                <p className="text-xl font-bold text-purple-950 dark:text-white truncate max-w-[200px]">
                                    {selectedWarehouse?.whName || effectiveWhCode}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Control Panel: Filters & View Toggle */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-6 justify-between">
                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-slate-600">คลังสินค้า:</span>
                        <WarehouseFilter
                            warehouses={warehouses.map(w => ({ whCode: w.whCode, whName: `${w.whCode} - ${w.whName}` }))}
                            defaultValue={effectiveWhCode}
                        />
                    </div>

                    <div className="h-8 w-[1px] bg-slate-200 hidden md:block" />

                    <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        <Link href={`?view=summary&whCode=${effectiveWhCode}`} prefetch={false}>
                            <Button
                                variant={view === 'summary' ? "default" : "ghost"}
                                size="sm"
                                className={`rounded-lg h-8 transition-all ${view === 'summary' ? 'bg-white text-indigo-600 shadow-sm font-bold' : 'text-slate-500'}`}
                            >
                                มุมมองสรุป
                            </Button>
                        </Link>
                        <Link href={`?view=card&whCode=${effectiveWhCode}`} prefetch={false}>
                            <Button
                                variant={view === 'card' ? "default" : "ghost"}
                                size="sm"
                                className={`rounded-lg h-8 transition-all ${view === 'card' ? 'bg-white text-indigo-600 shadow-sm font-bold' : 'text-slate-500'}`}
                            >
                                มุมมองสต็อกการ์ด (รายล็อต)
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="พิมพ์เพื่อค้นหารหัสหรือชื่อ..."
                        className="w-full pl-10 pr-4 h-10 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                    />
                </div>
            </div>

            {/* Main Table Content */}
            <Card className="border-0 shadow-md overflow-hidden rounded-2xl">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 border-b border-slate-100">
                                    <TableHead className="w-[120px] font-bold text-slate-600">คลัง</TableHead>
                                    <TableHead className="font-bold text-slate-600">รหัสสินค้า / รายละเอียด</TableHead>
                                    {view === 'card' && (
                                        <>
                                            <TableHead className="font-bold text-slate-600">วันที่ผลิต (MFG)</TableHead>
                                            <TableHead className="font-bold text-slate-600">วันหมดอายุ (EXP)</TableHead>
                                        </>
                                    )}
                                    <TableHead className="text-right font-bold text-slate-600 pr-8">จำนวนคงเหลือ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={view === 'card' ? 5 : 3} className="text-center py-20 text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <Search className="w-10 h-10 opacity-20" />
                                                <p>ไม่พบรายการสินค้าในคลังนี้</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((item: any) => (
                                        <TableRow key={item.id} className="group hover:bg-slate-50/80 transition-colors">
                                            <TableCell>
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-mono">
                                                    {item.whCode}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <Link
                                                        href={`/reports/stock-card-detail?productCode=${item.productCode}&whCode=${item.whCode}`}
                                                        className="text-indigo-600 font-bold hover:underline underline-offset-4 flex items-center gap-1"
                                                    >
                                                        {item.productCode}
                                                        <FileText className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </Link>
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        {item.product?.productName || item.productName}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            {view === 'card' && (
                                                <>
                                                    <TableCell className="text-slate-600">
                                                        {item.mfgDate ? new Date(item.mfgDate).toLocaleDateString('th-TH') : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={
                                                            (item.expDate && (new Date(item.expDate).getTime() < new Date().getTime() + (30 * 24 * 60 * 60 * 1000)))
                                                                ? "text-red-500 font-medium"
                                                                : "text-slate-600"
                                                        }>
                                                            {item.expDate ? new Date(item.expDate).toLocaleDateString('th-TH') : '-'}
                                                        </span>
                                                    </TableCell>
                                                </>
                                            )}
                                            <TableCell className="text-right pr-8">
                                                <div className="space-y-1">
                                                    <p className="text-lg font-black text-slate-900 dark:text-white">
                                                        {formatUOMBreakdown(item.qty, item.product?.productUOMs || [])}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        (รวม {item.qty.toLocaleString()} ชิ้น)
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-center py-4">
                <p className="text-xs text-slate-400 italic">
                    * ข้อมูลล่าสุด ณ วันที่ {new Date().toLocaleString('th-TH')}
                </p>
            </div>
        </div>
    );
}
