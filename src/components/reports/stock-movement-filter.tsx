"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { ProductAutocomplete } from "./product-autocomplete";

interface StockMovementFilterProps {
    initialStartDate?: string;
    initialEndDate?: string;
    initialProductCode?: string;
    initialWhCode?: string;
    warehouses: { whCode: string; whName: string }[];
}

export function StockMovementFilter({
    initialStartDate = "",
    initialEndDate = "",
    initialProductCode = "",
    initialWhCode = "",
    warehouses = []
}: StockMovementFilterProps) {
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

    return (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex-1 lg:max-w-4xl relative z-50">
            <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 px-1 text-left">คลังสินค้า</p>
                <select
                    className="w-full h-9 px-2 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    value={whCode}
                    onChange={(e) => setWhCode(e.target.value)}
                >
                    <option value="">ทุกคลังสินค้า</option>
                    {warehouses.map(wh => (
                        <option key={wh.whCode} value={wh.whCode}>
                            {wh.whCode} - {wh.whName}
                        </option>
                    ))}
                </select>
            </div>
            <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 px-1 text-left">เริ่มวันที่</p>
                <input
                    type="date"
                    className="w-full h-9 px-2 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
            </div>
            <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 px-1 text-left">ถึงวันที่</p>
                <input
                    type="date"
                    className="w-full h-9 px-2 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
            </div>
            <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 px-1 text-left">รหัสสินค้า</p>
                <ProductAutocomplete
                    value={productCode}
                    onChange={setProductCode}
                    onEnter={handleSearch}
                    placeholder="ระบุรหัสสินค้า..."
                    className="w-full h-9 pl-9 pr-3 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
            </div>
            <div className="flex items-end">
                <button
                    onClick={handleSearch}
                    className="w-full h-9 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-purple-100"
                >
                    <Search className="w-4 h-4" />
                    ค้นหา
                </button>
            </div>
        </div>
    );
}
