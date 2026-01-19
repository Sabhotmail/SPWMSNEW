import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
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
    Calendar,
    ArrowLeft,
    Package,
    ArrowDownRight,
    ArrowUpRight,
    Warehouse,
    CalendarDays,
    TrendingUp,
    TrendingDown,
    FileText,
    Clock,
} from "lucide-react";
import Link from "next/link";
import { StockCardDetailInlineFilter } from "@/components/reports/stock-card-detail-inline-filter";

export const dynamic = "force-dynamic";

interface TransactionDetail {
    productCode: string;
    pieceQty: number;
    mfgDate: Date | null;
    expDate: Date | null;
    docNo: string;
    header: {
        id: number;
        docNo: string;
        docDate: Date;
        whCode: string;
        toWhCode: string | null;
        docTypeCode: string;
        ref1: string | null;
        documentType: {
            docTypeName: string;
            movementType: string;
        };
        createdByUser: {
            username: string;
        } | null;
    };
}

async function getOpeningBalance(productCode: string, whCode: string, startDate?: string) {
    if (!startDate) return 0;
    const date = new Date(startDate);

    const movements = await prisma.transactionDetail.findMany({
        where: {
            productCode,
            header: {
                docStatus: "APPROVED",
                docDate: { lt: date },
            }
        },
        include: {
            header: {
                include: { documentType: true }
            }
        }
    });

    let balance = 0;
    movements.forEach(m => {
        const qty = Number(m.pieceQty);
        if (m.header.docTypeCode === "TRN") {
            if (m.header.whCode === whCode) balance -= qty;
            if (m.header.toWhCode === whCode) balance += qty;
        } else {
            if (m.header.whCode === whCode) {
                const direction = m.header.documentType.movementType === "IN" ? 1 : -1;
                balance += qty * direction;
            }
        }
    });

    return balance;
}

async function getStockLedger(productCode: string, whCode: string, startDate?: string, endDate?: string) {
    const where: any = {
        productCode,
        header: {
            docStatus: "APPROVED",
        }
    };

    if (startDate || endDate) {
        where.header.docDate = {};
        if (startDate) where.header.docDate.gte = new Date(startDate);
        if (endDate) where.header.docDate.lte = new Date(endDate);
    }

    const details = await prisma.transactionDetail.findMany({
        where,
        include: {
            header: {
                include: {
                    documentType: true,
                    createdByUser: {
                        select: { username: true }
                    },
                }
            }
        },
        orderBy: {
            header: {
                docDate: "asc"
            }
        }
    });

    return details;
}

async function getWarehouses() {
    return prisma.warehouse.findMany({
        where: { status: "ACTIVE" },
        orderBy: { seq: "asc" },
    });
}

export default async function StockCardDetailPage(props: {
    searchParams: Promise<{
        startDate?: string;
        endDate?: string;
        productCode?: string;
        whCode?: string;
    }>;
}) {
    await auth();
    const searchParams = await props.searchParams;
    const { startDate, endDate, productCode, whCode } = searchParams;

    const warehouses = await getWarehouses();
    const effectiveWhCode = whCode || (warehouses.length > 0 ? warehouses[0].whCode : "");
    const selectedWarehouse = warehouses.find(w => w.whCode === effectiveWhCode);

    const hasSearched = !!productCode;
    let ledger: TransactionDetail[] = [];
    let openingBalance = 0;
    let product: any = null;

    if (productCode && effectiveWhCode) {
        [openingBalance, ledger, product] = await Promise.all([
            getOpeningBalance(productCode, effectiveWhCode, startDate),
            getStockLedger(productCode, effectiveWhCode, startDate, endDate),
            prisma.product.findUnique({
                where: { productCode },
                include: {
                    brand: true,
                    principal: true,
                    productUOMs: {
                        where: { status: "ACTIVE" },
                        orderBy: { uomRatio: "desc" },
                    },
                }
            })
        ]);
    }

    // Helper function to convert pieces to UOM breakdown
    function convertToUOMBreakdown(totalPieces: number) {
        if (!product?.productUOMs || product.productUOMs.length === 0) return [{ uomCode: "PCS", qty: totalPieces }];

        let remaining = Math.abs(totalPieces);
        const breakdown: Array<{ uomCode: string; qty: number }> = [];

        const sortedUoms = [...product.productUOMs].sort((a: any, b: any) => b.uomRatio - a.uomRatio);

        for (const uom of sortedUoms) {
            const ratio = (uom as any).uomRatio || 1;
            if (ratio > 1 && remaining >= ratio) {
                const qty = Math.floor(remaining / ratio);
                breakdown.push({ uomCode: (uom as any).uomCode, qty });
                remaining = remaining % ratio;
            }
        }

        if (remaining > 0) {
            breakdown.push({ uomCode: "PCS", qty: remaining });
        }

        return breakdown;
    }

    function formatUOMBreakdown(totalPieces: number) {
        const breakdown = convertToUOMBreakdown(totalPieces);
        if (breakdown.length === 0) return "0 ชิ้น";

        const uomNames: Record<string, string> = {
            CTN: "ลัง",
            PAC: "แพ็ค",
            PACK: "แพ็ค",
            PCS: "ชิ้น",
        };

        return breakdown.map(b => `${b.qty} ${uomNames[b.uomCode] || b.uomCode}`).join(" + ");
    }

    // Process movements with running balance
    let currentBalance = openingBalance;
    let totalIn = 0;
    let totalOut = 0;

    const processedLedger = ledger.map(item => {
        const qty = Number(item.pieceQty);
        let inQty = 0;
        let outQty = 0;

        if (item.header.docTypeCode === "TRN") {
            if (item.header.whCode === effectiveWhCode) outQty = qty;
            if (item.header.toWhCode === effectiveWhCode) inQty = qty;
        } else {
            if (item.header.documentType.movementType === "IN") inQty = qty;
            else outQty = qty;
        }

        totalIn += inQty;
        totalOut += outQty;
        currentBalance += (inQty - outQty);

        return {
            ...item,
            inQty,
            outQty,
            runningBalance: currentBalance
        };
    });

    // Format date range for display
    const formatDateRange = () => {
        if (!startDate || !endDate) return "";
        const start = new Date(startDate);
        const end = new Date(endDate);
        return `${start.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} - ${end.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    };

    // Format exp date with color coding
    const getExpDateStyle = (expDate: Date | null) => {
        if (!expDate) return { className: "text-slate-400", text: "-" };
        const now = new Date();
        const exp = new Date(expDate);
        const daysUntilExpiry = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry <= 30) {
            return { className: "bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold", text: exp.toLocaleDateString('th-TH') };
        } else if (daysUntilExpiry <= 60) {
            return { className: "bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold", text: exp.toLocaleDateString('th-TH') };
        } else if (daysUntilExpiry <= 90) {
            return { className: "bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full", text: exp.toLocaleDateString('th-TH') };
        }
        return { className: "text-slate-600", text: exp.toLocaleDateString('th-TH') };
    };

    const closingBalance = openingBalance + totalIn - totalOut;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/20">
            <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/reports">
                        <Button variant="outline" size="icon" className="rounded-full shadow-sm bg-white hover:bg-purple-50 border-purple-100">
                            <ArrowLeft className="w-4 h-4 text-purple-600" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white shadow-lg">
                                <CalendarDays className="w-5 h-5" />
                            </div>
                            การเคลื่อนไหว (MFG/EXP)
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">ติดตามการเคลื่อนไหวพร้อมวันที่ผลิตและหมดอายุ</p>
                    </div>
                </div>

                {/* Inline Filter - แสดงบนหน้าหลัก ไม่ต้องเปิด Modal */}
                <StockCardDetailInlineFilter
                    warehouses={warehouses}
                    productCode={productCode}
                    whCode={effectiveWhCode}
                    startDate={startDate}
                    endDate={endDate}
                    hasSearched={hasSearched}
                    productName={product?.productName}
                    openingBalance={openingBalance}
                    ledgerData={processedLedger.map(item => ({
                        docDate: new Date(item.header.docDate).toLocaleDateString('th-TH'),
                        docNo: item.docNo,
                        refNo: item.header.ref1 || '',
                        mfgDate: item.mfgDate ? new Date(item.mfgDate).toLocaleDateString('th-TH') : undefined,
                        expDate: item.expDate ? new Date(item.expDate).toLocaleDateString('th-TH') : undefined,
                        inQty: item.inQty,
                        outQty: item.outQty,
                        runningBalance: item.runningBalance
                    }))}
                />

                {!hasSearched ? (
                    <Card className="border-0 shadow-xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-0">
                            <div className="flex flex-col items-center justify-center text-center py-24 px-6">
                                <div className="p-6 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full mb-6">
                                    <CalendarDays className="w-16 h-16 text-purple-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">กรุณาระบุเงื่อนไขการค้นหา</h3>
                                <p className="text-slate-500 max-w-md">
                                    คลิกปุ่ม "ระบุเงื่อนไข" เพื่อเลือกสินค้า คลังสินค้า และช่วงเวลาที่ต้องการดูรายงานการเคลื่อนไหว
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {/* Product & Summary Header */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Product Info Card */}
                            <Card className="lg:col-span-2 border-0 shadow-xl rounded-3xl overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 text-white">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-6">
                                        <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                                            <Package className="w-10 h-10" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-purple-200 text-sm font-medium mb-1">รหัสสินค้า</p>
                                            <p className="text-3xl font-black mb-2">{productCode}</p>
                                            <p className="text-lg font-semibold text-purple-100">{product?.productName || '-'}</p>
                                            {product?.principal && (
                                                <p className="text-purple-200 text-sm mt-1">
                                                    {product.principal.principalName} {product.brand?.brandName && `• ${product.brand.brandName}`}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-2 text-purple-200 text-sm mb-2">
                                                <Warehouse className="w-4 h-4" />
                                                <span>{selectedWarehouse?.whName || effectiveWhCode}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-purple-200 text-sm">
                                                <Calendar className="w-4 h-4" />
                                                <span>{formatDateRange()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Total In */}
                                <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-emerald-100 rounded-xl">
                                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-medium">รับเข้า</p>
                                                <p className="text-xl font-black text-emerald-600">{totalIn.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                {/* Total Out */}
                                <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-rose-100 rounded-xl">
                                                <TrendingDown className="w-5 h-5 text-rose-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-medium">จ่ายออก</p>
                                                <p className="text-xl font-black text-rose-600">{totalOut.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                {/* Opening Balance */}
                                <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-amber-100 rounded-xl">
                                                <ArrowDownRight className="w-5 h-5 text-amber-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-medium">ยอดยกมา</p>
                                                <p className="text-xl font-black text-amber-600">{openingBalance.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                {/* Closing Balance */}
                                <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-purple-100 rounded-xl">
                                                <ArrowUpRight className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-medium">ยอดคงเหลือ</p>
                                                <p className="text-xl font-black text-purple-600">{closingBalance.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Ledger Table */}
                        <Card className="border-0 shadow-xl rounded-3xl overflow-hidden bg-white">
                            <CardContent className="p-0">
                                {/* Table Header */}
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-5 h-5 text-slate-400" />
                                            <span className="font-bold text-slate-700">รายการเคลื่อนไหว</span>
                                            <span className="text-sm text-slate-400">({processedLedger.length} รายการ)</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs">
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-3 h-3 rounded-full bg-red-400"></span>
                                                <span className="text-slate-500">ใกล้หมดอายุ ≤30 วัน</span>
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-3 h-3 rounded-full bg-orange-400"></span>
                                                <span className="text-slate-500">31-60 วัน</span>
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                                                <span className="text-slate-500">61-90 วัน</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gradient-to-r from-slate-100 to-slate-50 hover:from-slate-100 hover:to-slate-50">
                                                <TableHead className="font-bold text-slate-600 py-4">วันที่บันทึก</TableHead>
                                                <TableHead className="font-bold text-slate-600">เลขที่เอกสาร</TableHead>
                                                <TableHead className="font-bold text-slate-600">เอกสารอ้างอิง</TableHead>
                                                <TableHead className="font-bold text-slate-600 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        MFG / EXP
                                                    </div>
                                                </TableHead>
                                                <TableHead className="font-bold text-slate-600 text-center">รับเข้า</TableHead>
                                                <TableHead className="font-bold text-slate-600 text-center">จ่ายออก</TableHead>
                                                <TableHead className="font-bold text-slate-600 text-right pr-6">ยอดคงเหลือ</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {/* Opening Balance Row */}
                                            <TableRow className="bg-gradient-to-r from-amber-50 to-orange-50/50 hover:from-amber-100 hover:to-orange-100/50">
                                                <TableCell className="py-4">
                                                    <span className="text-amber-700 font-medium">
                                                        {startDate ? new Date(startDate).toLocaleDateString('th-TH') : '-'}
                                                    </span>
                                                </TableCell>
                                                <TableCell colSpan={5} className="font-bold text-amber-800">
                                                    📦 ยอดยกมา
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="flex flex-col items-end">
                                                        <p className="font-black text-amber-700 text-lg">
                                                            {formatUOMBreakdown(openingBalance)}
                                                        </p>
                                                        <p className="text-xs text-amber-600/60 font-medium">
                                                            (รวม {openingBalance.toLocaleString()} ชิ้น)
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>

                                            {processedLedger.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center py-20">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <CalendarDays className="w-12 h-12 text-slate-200" />
                                                            <p className="text-slate-400">ไม่พบรายการเคลื่อนไหวในช่วงเวลาที่เลือก</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                processedLedger.map((item, index) => {
                                                    const expStyle = getExpDateStyle(item.expDate);
                                                    return (
                                                        <TableRow
                                                            key={index}
                                                            className="hover:bg-purple-50/50 transition-colors border-b border-slate-50"
                                                        >
                                                            <TableCell className="py-4">
                                                                <span className="text-slate-600">
                                                                    {new Date(item.header.docDate).toLocaleDateString('th-TH')}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Link
                                                                    href={`/transactions/${item.header.id}`}
                                                                    className="text-purple-600 font-bold hover:text-purple-800 hover:underline transition-colors"
                                                                >
                                                                    {item.docNo}
                                                                </Link>
                                                            </TableCell>
                                                            <TableCell className="text-slate-500">
                                                                {item.header.ref1 || '-'}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <div className="flex flex-col items-center gap-0.5">
                                                                    <span className="text-xs text-slate-400">
                                                                        {item.mfgDate ? new Date(item.mfgDate).toLocaleDateString('th-TH') : '-'}
                                                                    </span>
                                                                    <span className={`text-xs ${expStyle.className}`}>
                                                                        {expStyle.text}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                {item.inQty > 0 ? (
                                                                    <div className="inline-flex flex-col items-center">
                                                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-full text-sm">
                                                                            +{item.inQty.toLocaleString()}
                                                                        </span>
                                                                        <span className="text-[10px] text-slate-400 mt-0.5">
                                                                            ({formatUOMBreakdown(item.inQty)})
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-slate-300">-</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                {item.outQty > 0 ? (
                                                                    <div className="inline-flex flex-col items-center">
                                                                        <span className="px-3 py-1 bg-rose-100 text-rose-700 font-bold rounded-full text-sm">
                                                                            -{item.outQty.toLocaleString()}
                                                                        </span>
                                                                        <span className="text-[10px] text-slate-400 mt-0.5">
                                                                            ({formatUOMBreakdown(item.outQty)})
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-slate-300">-</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right pr-6">
                                                                <div className="flex flex-col items-end">
                                                                    <p className="font-black text-slate-900 text-lg">
                                                                        {formatUOMBreakdown(item.runningBalance)}
                                                                    </p>
                                                                    <p className="text-xs text-slate-400 font-medium italic">
                                                                        (รวม {item.runningBalance.toLocaleString()} ชิ้น)
                                                                    </p>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            )}

                                            {/* Closing Balance Row */}
                                            {processedLedger.length > 0 && (
                                                <TableRow className="bg-gradient-to-r from-purple-50 to-indigo-50/50 hover:from-purple-100 hover:to-indigo-100/50">
                                                    <TableCell className="py-4">
                                                        <span className="text-purple-700 font-medium">
                                                            {endDate ? new Date(endDate).toLocaleDateString('th-TH') : '-'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell colSpan={5} className="font-bold text-purple-800">
                                                        ✅ ยอดคงเหลือสิ้นงวด
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <div className="flex flex-col items-end">
                                                            <p className="font-black text-purple-700 text-xl">
                                                                {formatUOMBreakdown(closingBalance)}
                                                            </p>
                                                            <p className="text-xs text-purple-600/60 font-medium">
                                                                (รวม {closingBalance.toLocaleString()} ชิ้น)
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
