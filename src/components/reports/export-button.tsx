"use client";

import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import {
    exportStockBalanceToExcel,
    exportStockMovementToExcel,
    exportStockCardToExcel,
} from "@/lib/excel-export";

interface ExportButtonProps {
    type: "stock-balance" | "stock-movement" | "stock-card";
    data: any[];
    filters?: any;
    label?: string;
}

export function ExportButton({
    type,
    data,
    filters,
    label = "ส่งออก Excel",
}: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            // Small delay to show loading state
            await new Promise((resolve) => setTimeout(resolve, 300));

            switch (type) {
                case "stock-balance":
                    exportStockBalanceToExcel(data, filters);
                    break;
                case "stock-movement":
                    exportStockMovementToExcel(data, filters);
                    break;
                case "stock-card":
                    exportStockCardToExcel(data, filters);
                    break;
            }
        } catch (error) {
            console.error("Export error:", error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Button
            onClick={handleExport}
            disabled={isExporting || data.length === 0}
            variant="outline"
            size="sm"
            className="gap-2"
        >
            {isExporting ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    กำลังส่งออก...
                </>
            ) : (
                <>
                    <FileDown className="w-4 h-4" />
                    {label}
                </>
            )}
        </Button>
    );
}
