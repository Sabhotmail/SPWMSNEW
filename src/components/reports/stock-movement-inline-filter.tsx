"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Calendar, Package, Warehouse, RotateCcw, FileSpreadsheet, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductPickerModal } from "./product-picker-modal";
import { exportStockLedger } from "@/lib/export-excel";

interface InlineFilterProps {
    warehouses: { whCode: string; whName: string }[];
    productCode?: string;
    whCode?: string;
    startDate?: string;
    endDate?: string;
    hasSearched: boolean;
    productName?: string;
    openingBalance?: number;
    ledgerData?: {
        docDate: string;
        docNo: string;
        refNo: string;
        inQty: number;
        outQty: number;
        runningBalance: number;
    }[];
}

export function StockMovementInlineFilter({
    warehouses,
    productCode: initialProductCode = "",
    whCode: initialWhCode = "",
    startDate: initialStartDate,
    endDate: initialEndDate,
    hasSearched,
    productName,
    openingBalance = 0,
    ledgerData = []
}: InlineFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isExporting, setIsExporting] = useState(false);
    const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
    const months = [
        { value: "01", label: "ม.ค." },
        { value: "02", label: "ก.พ." },
        { value: "03", label: "มี.ค." },
        { value: "04", label: "เม.ย." },
        { value: "05", label: "พ.ค." },
        { value: "06", label: "มิ.ย." },
        { value: "07", label: "ก.ค." },
        { value: "08", label: "ส.ค." },
        { value: "09", label: "ก.ย." },
        { value: "10", label: "ต.ค." },
        { value: "11", label: "พ.ย." },
        { value: "12", label: "ธ.ค." },
    ];

    // Parse dates from URL
    const parseDate = (dateStr?: string) => {
        if (!dateStr) return { year: String(currentYear), month: "01" };
        const d = new Date(dateStr);
        return {
            year: String(d.getFullYear()),
            month: String(d.getMonth() + 1).padStart(2, "0")
        };
    };

    const start = parseDate(initialStartDate);
    const end = parseDate(initialEndDate);

    const [productCode, setProductCode] = useState(initialProductCode);
    const [whCode, setWhCode] = useState(initialWhCode || (warehouses.length > 0 ? warehouses[0].whCode : ""));
    const [startYear, setStartYear] = useState(start.year);
    const [startMonth, setStartMonth] = useState(start.month);
    const [endYear, setEndYear] = useState(end.year);
    const [endMonth, setEndMonth] = useState(initialEndDate ? end.month : "12");

    useEffect(() => {
        if (initialProductCode) setProductCode(initialProductCode);
        if (initialWhCode) setWhCode(initialWhCode);
    }, [initialProductCode, initialWhCode]);

    const handleSearch = () => {
        if (!productCode) {
            alert("กรุณาระบุรหัสสินค้า");
            return;
        }

        const params = new URLSearchParams();
        params.set("productCode", productCode);
        if (whCode) params.set("whCode", whCode);

        const startDate = `${startYear}-${startMonth}-01`;
        const endDate = `${endYear}-${endMonth}-31`;
        params.set("startDate", startDate);
        params.set("endDate", endDate);

        router.push(`?${params.toString()}`);
    };

    const handleClearSearch = () => {
        setProductCode("");
        router.push("/reports/stock-movement");
    };

    const handleProductSelect = (selectedProductCode: string) => {
        setProductCode(selectedProductCode);
        setIsProductPickerOpen(false);
    };

    const handleExport = async () => {
        if (!productCode || !whCode || !initialStartDate || !initialEndDate) return;

        setIsExporting(true);
        try {
            exportStockLedger(
                productCode,
                productName || "",
                whCode,
                initialStartDate,
                initialEndDate,
                openingBalance,
                ledgerData
            );
        } catch (error) {
            console.error("Export failed:", error);
            alert("เกิดข้อผิดพลาดในการ Export");
        } finally {
            setIsExporting(false);
        }
    };

    const selectClass = "h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none cursor-pointer";

    return (
        <>
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white/90 backdrop-blur-sm">
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-end gap-3">
                        {/* Product Code */}
                        <div className="flex-1 min-w-[200px]">
                            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-1.5">
                                <Package className="w-3.5 h-3.5" />
                                รหัสสินค้า
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={productCode}
                                    onChange={(e) => setProductCode(e.target.value)}
                                    placeholder="พิมพ์รหัสหรือเลือก..."
                                    className="flex-1 h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                />
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-10 px-3 rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50"
                                    onClick={() => setIsProductPickerOpen(true)}
                                >
                                    เลือก
                                </Button>
                            </div>
                        </div>

                        {/* Warehouse */}
                        <div className="w-[180px]">
                            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-1.5">
                                <Warehouse className="w-3.5 h-3.5" />
                                คลังสินค้า
                            </label>
                            <div className="relative">
                                <select
                                    value={whCode}
                                    onChange={(e) => setWhCode(e.target.value)}
                                    className={selectClass + " w-full pr-8"}
                                >
                                    {warehouses.map(wh => (
                                        <option key={wh.whCode} value={wh.whCode}>
                                            {wh.whName}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Start Date */}
                        <div className="w-[200px]">
                            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                ตั้งแต่
                            </label>
                            <div className="flex gap-1.5">
                                <div className="relative flex-1">
                                    <select
                                        value={startMonth}
                                        onChange={(e) => setStartMonth(e.target.value)}
                                        className={selectClass + " w-full pr-6"}
                                    >
                                        {months.map(month => (
                                            <option key={month.value} value={month.value}>{month.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                </div>
                                <div className="relative flex-1">
                                    <select
                                        value={startYear}
                                        onChange={(e) => setStartYear(e.target.value)}
                                        className={selectClass + " w-full pr-6"}
                                    >
                                        {years.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* End Date */}
                        <div className="w-[200px]">
                            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                ถึง
                            </label>
                            <div className="flex gap-1.5">
                                <div className="relative flex-1">
                                    <select
                                        value={endMonth}
                                        onChange={(e) => setEndMonth(e.target.value)}
                                        className={selectClass + " w-full pr-6"}
                                    >
                                        {months.map(month => (
                                            <option key={month.value} value={month.value}>{month.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                </div>
                                <div className="relative flex-1">
                                    <select
                                        value={endYear}
                                        onChange={(e) => setEndYear(e.target.value)}
                                        className={selectClass + " w-full pr-6"}
                                    >
                                        {years.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <Button
                                onClick={handleSearch}
                                className="h-10 px-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-bold shadow-lg shadow-blue-200/50"
                            >
                                <Search className="w-4 h-4 mr-1.5" />
                                ค้นหา
                            </Button>
                            {hasSearched && (
                                <>
                                    <Button
                                        onClick={handleClearSearch}
                                        variant="outline"
                                        className="h-10 px-4 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg"
                                    >
                                        <RotateCcw className="w-4 h-4 mr-1.5" />
                                        ล้าง
                                    </Button>
                                    <Button
                                        onClick={handleExport}
                                        disabled={isExporting || ledgerData.length === 0}
                                        variant="outline"
                                        className="h-10 px-4 border-green-200 text-green-700 hover:bg-green-50 rounded-lg"
                                    >
                                        {isExporting ? (
                                            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                        ) : (
                                            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                                        )}
                                        Excel
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Product Picker Modal - ยังคงใช้ Modal สำหรับเลือกสินค้า */}
            <ProductPickerModal
                isOpen={isProductPickerOpen}
                onClose={() => setIsProductPickerOpen(false)}
                onSelect={handleProductSelect}
            />
        </>
    );
}
