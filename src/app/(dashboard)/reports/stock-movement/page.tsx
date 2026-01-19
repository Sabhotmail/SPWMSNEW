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
    Activity,
    ArrowLeft,
    Package,
    ArrowDownRight,
    ArrowUpRight,
    Warehouse,
    Calendar,
    TrendingUp,
    TrendingDown,
    FileText,
} from "lucide-react";
import Link from "next/link";
import { StockMovementInlineFilter } from "@/components/reports/stock-movement-inline-filter";

export const dynamic = "force-dynamic";

interface TransactionDetail {
    productCode: string;
    pieceQty: number;
    mfgDate: Date | null;
    expDate: Date | null;
    docNo: string;
    movementTypeCode: string | null;
    header: {
        id: number;
        docNo: string;
        docDate: Date;
        whCode: string;
        toWhCode: string | null;
        docTypeCode: string;
        ref1: string | null;
        movementTypeCode: string | null;
        documentType: {
            docTypeName: string;
            movementType: string;
        };
        createdByUser: {
            username: string;
        } | null;
    };
}

async function getOpeningBalance(productCode: string, whCode: string, startDate?: string, movementTypeMap: Map<string, string> = new Map()) {
    if (!startDate) return 0;
    const date = new Date(startDate);

    const movements = await prisma.transactionDetail.findMany({
        where: {
            productCode,
            whCode,
            header: {
                docStatus: "APPROVED",
                docDate: { lt: date },
            }
        },
        include: {
            header: true
        }
    });

    let balance = 0;
    movements.forEach(m => {
        const qty = Number(m.pieceQty);
        // ใช้ movementTypeCode จาก Detail ถ้ามี ไม่งั้นใช้จาก Header
        const mtCode = m.movementTypeCode || m.header.movementTypeCode || '';
        // ดึง direction จาก MovementType mapping (IN หรือ OUT)
        const direction = movementTypeMap.get(mtCode) || 'IN';

        // คำนวณตาม direction: IN = บวก, OUT = ลบ
        if (direction === 'IN') {
            balance += qty;
        } else {
            balance -= qty;
        }
    });

    return balance;
}

async function getStockLedger(productCode: string, whCode: string, startDate?: string, endDate?: string) {
    const where: any = {
        productCode,
        whCode,
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

// ดึง MovementType mapping (movementTypeCode -> direction)
async function getMovementTypeMap() {
    const movementTypes = await prisma.movementType.findMany();
    const map = new Map<string, string>();
    movementTypes.forEach(mt => {
        map.set(mt.movementTypeCode, mt.direction);
    });
    return map;
}

async function getWarehouses() {
    return prisma.warehouse.findMany({
        where: { status: "ACTIVE" },
        orderBy: { seq: "asc" },
    });
}

export default async function StockMovementPage(props: {
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

    // ดึง MovementType mapping ก่อน
    const movementTypeMap = await getMovementTypeMap();

    if (productCode && effectiveWhCode) {
        [openingBalance, ledger, product] = await Promise.all([
            getOpeningBalance(productCode, effectiveWhCode, startDate, movementTypeMap),
            getStockLedger(productCode, effectiveWhCode, startDate, endDate),
            prisma.product.findUnique({
                where: { productCode },
                include: {
                    brand: true,
                    principal: true,
                    productUOMs: {
                        orderBy: { uomRatio: 'desc' }
                    }
                }
            })
        ]);
    }

    // ฟังก์ชันช่วยคำนวณหน่วยผสม (เช่น 2 ลัง + 6 ชิ้น)
    const formatMixedUnits = (totalPieces: number) => {
        if (!product?.productUOMs || product.productUOMs.length === 0) return `${totalPieces} ชิ้น`;

        let remaining = Math.abs(totalPieces);
        const parts: string[] = [];

        // กรองเอาเฉพาะข้อมูลที่มี ratio > 0 และเรียงจากใหญ่ไปเล็ก
        const uoms = [...product.productUOMs].sort((a, b) => b.uomRatio - a.uomRatio);

        uoms.forEach((uom: any) => {
            const ratio = uom.uomRatio || 1;
            if (ratio > 1 && remaining >= ratio) {
                const count = Math.floor(remaining / ratio);
                remaining %= ratio;

                // เปลี่ยนชื่อหน่วยให้เป็นภาษาไทยตามความเหมาะสม
                let displayUnit = uom.uomCode;
                if (displayUnit === 'CTN') displayUnit = 'ลัง';
                if (displayUnit === 'PAC' || displayUnit === 'PACK') displayUnit = 'แพ็ค';
                if (displayUnit === 'PCS') displayUnit = 'ชิ้น';

                parts.push(`${count} ${displayUnit}`);
            }
        });

        // Add remaining pieces if any
        if (remaining > 0) {
            parts.push(`${remaining} ชิ้น`);
        }

        const sign = totalPieces < 0 ? "-" : "";
        return parts.length > 0 ? `${sign}${parts.join(' + ')}` : '0 ชิ้น';
    };

    // ค่าตัวหาร (Pack Size) ของหน่วยที่ต้องการแสดงเป็นหลัก (CTN)
    const ctnRatio = product?.productUOMs?.find((u: any) => u.uomCode === 'CTN')?.uomRatio || 1;

    // Process movements with running balance
    let currentBalance = openingBalance;
    let totalIn = 0;
    let totalOut = 0;

    const processedLedger = ledger.map(item => {
        const qty = Number(item.pieceQty);
        let inQty = 0;
        let outQty = 0;

        // ใช้ movementTypeCode จาก Detail หรือ Header
        const mtCode = item.movementTypeCode || item.header.movementTypeCode || '';
        const direction = movementTypeMap.get(mtCode) || 'IN';

        // คำนวณตาม direction
        if (direction === 'IN') {
            inQty = qty;
        } else {
            outQty = qty;
        }

        totalIn += inQty;
        totalOut += outQty;
        currentBalance += (inQty - outQty);

        return {
            ...item,
            inQty,
            outQty,
            runningBalance: currentBalance,
            displayInQty: inQty / ctnRatio,
            displayOutQty: outQty / ctnRatio,
            displayRunningBalance: currentBalance / ctnRatio
        };
    });

    // ยอดยกมาในหน่วยแสดงผล
    const displayOpeningBalance = openingBalance / ctnRatio;

    // Format date range for display
    const formatDateRange = () => {
        if (!startDate || !endDate) return "";
        const start = new Date(startDate);
        const end = new Date(endDate);
        return `${start.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} - ${end.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    };

    // Final closing balance calculation (in pieces) for simplicity in some places
    const closingBalance = currentBalance;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
            <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/reports">
                        <Button variant="outline" size="icon" className="rounded-full shadow-sm bg-white hover:bg-blue-50 border-blue-100">
                            <ArrowLeft className="w-4 h-4 text-blue-600" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-lg">
                                <Activity className="w-5 h-5" />
                            </div>
                            การเคลื่อนไหวสินค้า
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">ตรวจสอบประวัติการรับ-จ่ายสินค้า</p>
                    </div>
                </div>

                {/* Inline Filter - อยู่บนหน้าหลักเลย ไม่ต้องเปิด Modal */}
                <StockMovementInlineFilter
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
                        inQty: item.inQty,
                        outQty: item.outQty,
                        runningBalance: item.runningBalance
                    }))}
                />

                {!hasSearched ? (
                    <Card className="border-0 shadow-xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-0">
                            <div className="flex flex-col items-center justify-center text-center py-24 px-6">
                                <div className="p-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-6">
                                    <Activity className="w-16 h-16 text-blue-400" />
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
                        <div className="flex flex-col lg:flex-row gap-6 mb-8">
                            {/* Left: Product Info Card */}
                            <Card className="flex-1 border-0 shadow-xl rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-indigo-900 text-white min-h-[200px]">
                                <CardContent className="p-8 relative h-full flex flex-col justify-between">
                                    <div className="absolute right-0 top-0 p-8 opacity-10">
                                        <Package className="w-32 h-32" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                                <Package className="w-8 h-8 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-blue-100 text-sm font-medium">รหัสสินค้า</p>
                                                <h1 className="text-4xl font-black tracking-tight">{productCode}</h1>
                                            </div>
                                        </div>
                                        <h2 className="text-2xl font-bold text-white/90 mb-2">{product?.productName}</h2>
                                        <div className="flex flex-wrap gap-4 mt-4">
                                            <div className="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold border border-white/10">
                                                {product?.brand?.brandName || "ไม่ระบุแบรนด์"}
                                            </div>
                                            <div className="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold border border-white/10">
                                                Pack Size: {ctnRatio}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative z-10 mt-8 flex flex-wrap gap-6 pt-6 border-t border-white/10">
                                        <div className="flex items-center gap-2">
                                            <Warehouse className="w-4 h-4 text-blue-200" />
                                            <span className="font-bold">{selectedWarehouse?.whName || effectiveWhCode}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-blue-200" />
                                            <span className="font-bold text-blue-100">{formatDateRange()}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Right: Summary Stats */}
                            <div className="grid grid-cols-2 gap-4 w-full lg:w-[480px]">
                                {/* Opening Balance */}
                                <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white hover:shadow-xl transition-shadow border-b-4 border-amber-500">
                                    <CardContent className="p-5">
                                        <div className="flex flex-col gap-3">
                                            <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center">
                                                <ArrowDownRight className="w-5 h-5 text-amber-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">ยอดยกมา</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-black text-slate-900">{displayOpeningBalance.toLocaleString()}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">ลัง</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Total In */}
                                <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white hover:shadow-xl transition-shadow border-b-4 border-emerald-500">
                                    <CardContent className="p-5">
                                        <div className="flex flex-col gap-3">
                                            <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center">
                                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">รับรวม</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-black text-emerald-600">+{(totalIn / ctnRatio).toLocaleString()}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">ลัง</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Total Out */}
                                <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white hover:shadow-xl transition-shadow border-b-4 border-rose-500">
                                    <CardContent className="p-5">
                                        <div className="flex flex-col gap-3">
                                            <div className="w-10 h-10 bg-rose-100 rounded-2xl flex items-center justify-center">
                                                <TrendingDown className="w-5 h-5 text-rose-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">จ่ายรวม</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-black text-rose-600">-{(totalOut / ctnRatio).toLocaleString()}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">ลัง</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Closing Balance */}
                                <Card className="border-0 shadow-xl rounded-3xl overflow-hidden bg-slate-900 text-white group border-b-4 border-blue-500">
                                    <CardContent className="p-5">
                                        <div className="flex flex-col gap-3">
                                            <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center">
                                                <ArrowUpRight className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">ยอดคงเหลือ</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-black text-blue-400 group-hover:text-blue-300 transition-colors uppercase">
                                                        {(currentBalance / ctnRatio).toLocaleString()}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-bold">ลัง</span>
                                                </div>
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
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gradient-to-r from-slate-100 to-slate-50 hover:from-slate-100 hover:to-slate-50">
                                                <TableHead className="font-bold text-slate-600 py-4">วันที่บันทึก</TableHead>
                                                <TableHead className="font-bold text-slate-600">เลขที่เอกสาร</TableHead>
                                                <TableHead className="font-bold text-slate-600">เอกสารอ้างอิง</TableHead>
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
                                                <TableCell colSpan={4} className="font-bold text-amber-800">
                                                    📦 ยอดยกมา
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="flex flex-col items-end">
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="font-black text-amber-700 text-lg">
                                                                {displayOpeningBalance.toLocaleString()}
                                                            </span>
                                                            <span className="text-amber-500 text-[10px] font-bold uppercase">ลัง</span>
                                                        </div>
                                                        <span className="text-[10px] text-amber-600/60 font-medium">({formatMixedUnits(openingBalance)})</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>

                                            {processedLedger.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-20">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <Activity className="w-12 h-12 text-slate-200" />
                                                            <p className="text-slate-400">ไม่พบรายการเคลื่อนไหวในช่วงเวลาที่เลือก</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                processedLedger.map((item, index) => (
                                                    <TableRow
                                                        key={index}
                                                        className="hover:bg-blue-50/50 transition-colors border-b border-slate-50"
                                                    >
                                                        <TableCell className="py-4">
                                                            <span className="text-slate-600">
                                                                {new Date(item.header.docDate).toLocaleDateString('th-TH')}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Link
                                                                href={`/transactions/${item.header.id}`}
                                                                className="text-blue-600 font-bold hover:text-blue-800 hover:underline transition-colors"
                                                            >
                                                                {item.docNo}
                                                            </Link>
                                                        </TableCell>
                                                        <TableCell className="text-slate-500">
                                                            {item.header.ref1 || '-'}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {item.displayInQty > 0 ? (
                                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-full text-sm">
                                                                    +{item.displayInQty.toLocaleString()}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-300">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {item.displayOutQty > 0 ? (
                                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-700 font-bold rounded-full text-sm">
                                                                    -{item.displayOutQty.toLocaleString()}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-300">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right pr-6">
                                                            <div className="flex flex-col items-end">
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="font-black text-slate-900 text-lg">
                                                                        {item.displayRunningBalance.toLocaleString()}
                                                                    </span>
                                                                    <span className="text-slate-400 text-[10px] font-bold uppercase">ลัง</span>
                                                                </div>
                                                                <span className="text-[10px] text-slate-400 font-medium italic">({formatMixedUnits(item.runningBalance)})</span>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}

                                            {/* Closing Balance Row */}
                                            {processedLedger.length > 0 && (
                                                <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50/50 hover:from-blue-100 hover:to-indigo-100/50">
                                                    <TableCell className="py-4">
                                                        <span className="text-blue-700 font-medium">
                                                            {endDate ? new Date(endDate).toLocaleDateString('th-TH') : '-'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell colSpan={4} className="font-bold text-blue-800">
                                                        ✅ ยอดคงเหลือสิ้นงวด
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <div className="flex flex-col items-end">
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="font-black text-blue-700 text-xl">
                                                                    {(currentBalance / ctnRatio).toLocaleString()}
                                                                </span>
                                                                <span className="text-blue-500 text-[10px] font-bold uppercase">ลัง</span>
                                                            </div>
                                                            <span className="text-[10px] text-blue-600/60 font-medium">({formatMixedUnits(currentBalance)})</span>
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
