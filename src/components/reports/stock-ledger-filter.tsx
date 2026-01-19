"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { RotateCcw, Filter, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductAutocomplete } from "./product-autocomplete";

interface StockLedgerFilterProps {
    initialStartDate?: string;
    initialEndDate?: string;
    initialProductCode?: string;
    initialWhCode?: string;
    warehouses: { whCode: string; whName: string }[];
}

export function StockLedgerFilter({
    initialStartDate = "",
    initialEndDate = "",
    initialProductCode = "",
    initialWhCode = "",
    warehouses = []
}: StockLedgerFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);
    const [productCode, setProductCode] = useState(initialProductCode);
    const [whCode, setWhCode] = useState(initialWhCode);

    const handleSearch = () => {
        const params = new URLSearchParams(searchParams.toString());

        if (startDate) params.set("startDate", startDate);
        else params.delete("startDate");

        if (endDate) params.set("endDate", endDate);
        else params.delete("endDate");

        if (productCode) params.set("productCode", productCode);
        else params.delete("productCode");

        if (whCode) params.set("whCode", whCode);
        else params.delete("whCode");

        router.push(`?${params.toString()}`);
    };

    const handleReset = () => {
        setStartDate("");
        setEndDate("");
        setProductCode("");
        setWhCode("");
        router.push("?");
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="relative z-50 bg-white dark:bg-slate-900 md:p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">คลังสินค้า</label>
                        <select
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-transparent text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            value={whCode}
                            onChange={(e) => setWhCode(e.target.value)}
                        >
                            <option value="">เลือกคลังสินค้า...</option>
                            {warehouses.map(wh => (
                                <option key={wh.whCode} value={wh.whCode}>
                                    {wh.whCode} - {wh.whName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">เริ่มวันที่</label>
                        <input
                            type="date"
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-transparent text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">ถึงวันที่</label>
                        <input
                            type="date"
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-transparent text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">รหัสสินค้า</label>
                        <ProductAutocomplete
                            value={productCode}
                            onChange={setProductCode}
                            onEnter={handleSearch}
                            placeholder="ระบุรหัสสินค้า..."
                        />
                    </div>
                    <div className="flex items-end gap-2">
                        <Button
                            onClick={handleSearch}
                            className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02]"
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            ค้นหา
                        </Button>
                        <Button
                            onClick={handleReset}
                            variant="outline"
                            className="h-11 px-4 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pr-1">
                <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50 shadow-sm h-10 rounded-xl">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export to Excel
                </Button>
            </div>
        </div>
    );
}
