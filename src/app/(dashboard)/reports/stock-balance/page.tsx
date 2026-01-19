import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    BarChart3,
    Package,
    Warehouse,
} from "lucide-react";
import { ExportButton } from "@/components/reports/export-button";
import { WarehouseFilter } from "@/components/reports/warehouse-filter";

async function getStockBalance(whCode?: string) {
    const where: any = {
        qty: { gt: 0 },
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
            warehouse: true,
        },
        orderBy: [
            { whCode: "asc" },
            { locCode: "asc" },
            { productCode: "asc" },
        ],
    });

    return stocks;
}

// Helper function to convert pieces to UOM breakdown
function convertToUOMBreakdown(totalPieces: number, uoms: Array<{ uomCode: string; uomRatio: number }>) {
    let remaining = totalPieces;
    const breakdown: Array<{ uomCode: string; qty: number }> = [];

    // Sort by ratio descending (CTN > PAC > PCS)
    const sortedUoms = [...uoms].sort((a, b) => b.uomRatio - a.uomRatio);

    for (const uom of sortedUoms) {
        if (uom.uomRatio > 1 && remaining >= uom.uomRatio) {
            const qty = Math.floor(remaining / uom.uomRatio);
            breakdown.push({ uomCode: uom.uomCode, qty });
            remaining = remaining % uom.uomRatio;
        }
    }

    // Add remaining pieces
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

async function getStockSummary(whCode?: string) {
    const where: any = { qty: { gt: 0 } };
    if (whCode) {
        where.whCode = whCode;
    }

    const [totalProducts, totalWarehouses, totalStock] = await Promise.all([
        prisma.stock.groupBy({
            by: ["productCode"],
            where,
        }),
        prisma.stock.groupBy({
            by: ["whCode"],
            where,
        }),
        prisma.stock.aggregate({
            _sum: { qty: true },
            where,
        }),
    ]);

    return {
        totalProducts: totalProducts.length,
        totalWarehouses: totalWarehouses.length,
        totalQty: Number(totalStock._sum.qty || 0),
    };
}

export default async function StockBalancePage(props: {
    searchParams: Promise<{ whCode?: string | string[] }>;
}) {
    await auth();
    const searchParams = await props.searchParams;
    const whCode = typeof searchParams.whCode === 'string'
        ? searchParams.whCode
        : Array.isArray(searchParams.whCode)
            ? searchParams.whCode[0]
            : undefined;

    const [stocks, summary, warehouses] = await Promise.all([
        getStockBalance(whCode),
        getStockSummary(whCode),
        prisma.warehouse.findMany({ where: { status: "ACTIVE" } }),
    ]);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <BarChart3 className="w-7 h-7 text-blue-600" />
                        รายงานยอดคงคลัง
                    </h1>
                    <p className="text-slate-500">แสดงยอดยกมาและยอดคงเหลือสินค้าในคลัง</p>
                </div>

                {/* Filter */}
                <WarehouseFilter
                    warehouses={warehouses.map(w => ({ whCode: w.whCode, whName: w.whName }))}
                    defaultValue={whCode || ""}
                />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100">
                                <Package className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">สินค้ามีสต๊อก</p>
                                <p className="text-xl font-bold">{summary.totalProducts} รายการ</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-100">
                                <Warehouse className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">คลังที่มีสินค้า</p>
                                <p className="text-xl font-bold">{summary.totalWarehouses} แห่ง</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-100">
                                <BarChart3 className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">จำนวนรวม</p>
                                <p className="text-xl font-bold">{summary.totalQty.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Stock Table */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">รายละเอียดยอดคงคลัง</CardTitle>
                        <ExportButton
                            type="stock-balance"
                            data={stocks.map((stock) => ({
                                productCode: stock.productCode,
                                productName: stock.product.productName,
                                whCode: stock.whCode,
                                whName: stock.warehouse.whName,
                                balance: Number(stock.qty),
                                uomCode: "PCS",
                            }))}
                            filters={{ whCode }}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead>คลัง</TableHead>
                                <TableHead>รหัสสินค้า</TableHead>
                                <TableHead>ชื่อสินค้า</TableHead>
                                <TableHead className="text-right">จำนวน</TableHead>
                                <TableHead>สถานะ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stocks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                                        <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                        <p>ยังไม่มียอดสินค้าคงคลัง</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                stocks.map((stock) => (
                                    <TableRow key={stock.id} className="hover:bg-slate-50">
                                        <TableCell>
                                            <Badge variant="secondary">{stock.whCode}</Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">{stock.productCode}</TableCell>
                                        <TableCell>{stock.product.productName}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="space-y-1">
                                                <p className="font-bold text-blue-600">
                                                    {formatUOMBreakdown(Number(stock.qty), stock.product.productUOMs)}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    (รวม {Number(stock.qty).toLocaleString()} ชิ้น)
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={
                                                    Number(stock.qty) > 10
                                                        ? "bg-green-100 text-green-700 hover:bg-green-100"
                                                        : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                                                }
                                            >
                                                {Number(stock.qty) > 10 ? "ปกติ" : "เหลือน้อย"}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Client-side logic is now handled by WarehouseFilter component */}
        </div>
    );
}
