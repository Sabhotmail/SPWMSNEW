"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Filter, RotateCcw, FileSpreadsheet, Loader2 } from "lucide-react";
import { FilterModal } from "@/components/reports/filter-modal";
import { exportStockLedger } from "@/lib/export-excel";

interface StockMovementClientProps {
    warehouses: { whCode: string; whName: string }[];
    productCode?: string;
    whCode?: string;
    startDate?: string;
    endDate?: string;
    hasSearched: boolean;
    // Export data
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

export function StockMovementClient({
    warehouses,
    productCode,
    whCode,
    startDate,
    endDate,
    hasSearched,
    productName,
    openingBalance = 0,
    ledgerData = []
}: StockMovementClientProps) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(!hasSearched);
    const [isExporting, setIsExporting] = useState(false);

    // Parse startDate and endDate into year/month
    const parseDate = (dateStr?: string) => {
        if (!dateStr) return { year: "", month: "" };
        const d = new Date(dateStr);
        return {
            year: String(d.getFullYear()),
            month: String(d.getMonth() + 1).padStart(2, "0")
        };
    };

    const start = parseDate(startDate);
    const end = parseDate(endDate);

    const handleClearSearch = () => {
        router.push("/reports/stock-movement");
    };

    const handleExport = async () => {
        if (!productCode || !whCode || !startDate || !endDate) return;

        setIsExporting(true);
        try {
            exportStockLedger(
                productCode,
                productName || "",
                whCode,
                startDate,
                endDate,
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

    return (
        <>
            <div className="flex gap-3">
                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg"
                >
                    <Filter className="w-4 h-4 mr-2" />
                    ระบุเงื่อนไข
                </Button>
                {hasSearched && (
                    <>
                        <Button
                            onClick={handleClearSearch}
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            ล้างการค้นหา
                        </Button>
                        <Button
                            onClick={handleExport}
                            disabled={isExporting || ledgerData.length === 0}
                            variant="outline"
                            className="border-green-200 text-green-700 hover:bg-green-50 rounded-xl font-bold"
                        >
                            {isExporting ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <FileSpreadsheet className="w-4 h-4 mr-2" />
                            )}
                            Export
                        </Button>
                    </>
                )}
            </div>

            <FilterModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                warehouses={warehouses}
                initialProductCode={productCode}
                initialWhCode={whCode}
                initialStartYear={start.year}
                initialStartMonth={start.month}
                initialEndYear={end.year}
                initialEndMonth={end.month}
            />
        </>
    );
}
