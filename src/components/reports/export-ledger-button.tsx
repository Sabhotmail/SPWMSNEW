"use client";

import { useState } from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportStockLedger } from "@/lib/export-excel";

interface ExportLedgerButtonProps {
    productCode: string;
    productName: string;
    whCode: string;
    startDate: string;
    endDate: string;
    openingBalance: number;
    ledgerData: {
        docDate: string;
        docNo: string;
        refNo: string;
        mfgDate?: string;
        expDate?: string;
        inQty: number;
        outQty: number;
        runningBalance: number;
    }[];
}

export function ExportLedgerButton({
    productCode,
    productName,
    whCode,
    startDate,
    endDate,
    openingBalance,
    ledgerData,
}: ExportLedgerButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            exportStockLedger(
                productCode,
                productName,
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
        <Button
            onClick={handleExport}
            disabled={isExporting || ledgerData.length === 0}
            variant="outline"
            className="border-green-200 text-green-700 hover:bg-green-50 shadow-sm rounded-xl"
        >
            {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
                <FileSpreadsheet className="w-4 h-4 mr-2" />
            )}
            Export to Excel
        </Button>
    );
}
