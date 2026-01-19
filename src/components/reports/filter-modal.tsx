"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Search, Calendar, Package, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductPickerModal } from "./product-picker-modal";

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    warehouses: { whCode: string; whName: string }[];
    initialProductCode?: string;
    initialWhCode?: string;
    initialStartYear?: string;
    initialStartMonth?: string;
    initialEndYear?: string;
    initialEndMonth?: string;
}

export function FilterModal({
    isOpen,
    onClose,
    warehouses,
    initialProductCode = "",
    initialWhCode = "",
    initialStartYear = "",
    initialStartMonth = "",
    initialEndYear = "",
    initialEndMonth = "",
}: FilterModalProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
    const months = [
        { value: "01", label: "มกราคม" },
        { value: "02", label: "กุมภาพันธ์" },
        { value: "03", label: "มีนาคม" },
        { value: "04", label: "เมษายน" },
        { value: "05", label: "พฤษภาคม" },
        { value: "06", label: "มิถุนายน" },
        { value: "07", label: "กรกฎาคม" },
        { value: "08", label: "สิงหาคม" },
        { value: "09", label: "กันยายน" },
        { value: "10", label: "ตุลาคม" },
        { value: "11", label: "พฤศจิกายน" },
        { value: "12", label: "ธันวาคม" },
    ];

    const [productCode, setProductCode] = useState(initialProductCode);
    const [whCode, setWhCode] = useState(initialWhCode || (warehouses.length > 0 ? warehouses[0].whCode : ""));
    const [startYear, setStartYear] = useState(initialStartYear || String(currentYear));
    const [startMonth, setStartMonth] = useState(initialStartMonth || "01");
    const [endYear, setEndYear] = useState(initialEndYear || String(currentYear));
    const [endMonth, setEndMonth] = useState(initialEndMonth || "12");
    const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);

    useEffect(() => {
        if (initialProductCode) setProductCode(initialProductCode);
        if (initialWhCode) setWhCode(initialWhCode);
        if (initialStartYear) setStartYear(initialStartYear);
        if (initialStartMonth) setStartMonth(initialStartMonth);
        if (initialEndYear) setEndYear(initialEndYear);
        if (initialEndMonth) setEndMonth(initialEndMonth);
    }, [initialProductCode, initialWhCode, initialStartYear, initialStartMonth, initialEndYear, initialEndMonth]);

    const handleSearch = () => {
        if (!productCode) {
            alert("กรุณาระบุรหัสสินค้า");
            return;
        }

        const params = new URLSearchParams(searchParams.toString());

        params.set("productCode", productCode);
        if (whCode) params.set("whCode", whCode);

        // Build date range
        const startDate = `${startYear}-${startMonth}-01`;
        const endDate = `${endYear}-${endMonth}-31`;
        params.set("startDate", startDate);
        params.set("endDate", endDate);

        router.push(`?${params.toString()}`);
        onClose();
    };

    const handleProductSelect = (selectedProductCode: string) => {
        setProductCode(selectedProductCode);
        setIsProductPickerOpen(false);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white">
                        <h2 className="text-xl font-bold">กรุณาระบุเงื่อนไข</h2>
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">
                        {/* Product Code */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-blue-700">
                                <Package className="w-4 h-4" />
                                รหัสสินค้า
                            </label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={productCode}
                                    onChange={(e) => setProductCode(e.target.value)}
                                    placeholder="ระบุรหัสสินค้า..."
                                    className="flex-1 h-12 px-4 rounded-xl border-2 border-blue-200 bg-white text-sm focus:border-blue-500 focus:ring-0 outline-none transition-colors placeholder:text-slate-400"
                                />
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700 h-12 px-5 rounded-xl font-bold shadow-lg shadow-blue-200"
                                    onClick={() => setIsProductPickerOpen(true)}
                                >
                                    เลือกสินค้า
                                </Button>
                            </div>
                        </div>

                        {/* Warehouse */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-blue-700">
                                <Warehouse className="w-4 h-4" />
                                คลังสินค้า
                            </label>
                            <select
                                value={whCode}
                                onChange={(e) => setWhCode(e.target.value)}
                                className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 bg-white text-sm focus:border-blue-500 outline-none transition-colors appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_16px_center] bg-no-repeat"
                            >
                                {warehouses.map(wh => (
                                    <option key={wh.whCode} value={wh.whCode}>
                                        {wh.whName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Start Date */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-blue-700">
                                <Calendar className="w-4 h-4" />
                                เริ่มต้น
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <select
                                    value={startYear}
                                    onChange={(e) => setStartYear(e.target.value)}
                                    className="h-12 px-4 rounded-xl border-2 border-slate-200 bg-white text-sm focus:border-blue-500 outline-none transition-colors appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_16px_center] bg-no-repeat"
                                >
                                    {years.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                                <select
                                    value={startMonth}
                                    onChange={(e) => setStartMonth(e.target.value)}
                                    className="h-12 px-4 rounded-xl border-2 border-slate-200 bg-white text-sm focus:border-blue-500 outline-none transition-colors appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_16px_center] bg-no-repeat"
                                >
                                    {months.map(month => (
                                        <option key={month.value} value={month.value}>{month.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* End Date */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-blue-700">
                                <Calendar className="w-4 h-4" />
                                สิ้นสุด
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <select
                                    value={endYear}
                                    onChange={(e) => setEndYear(e.target.value)}
                                    className="h-12 px-4 rounded-xl border-2 border-slate-200 bg-white text-sm focus:border-blue-500 outline-none transition-colors appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_16px_center] bg-no-repeat"
                                >
                                    {years.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                                <select
                                    value={endMonth}
                                    onChange={(e) => setEndMonth(e.target.value)}
                                    className="h-12 px-4 rounded-xl border-2 border-slate-200 bg-white text-sm focus:border-blue-500 outline-none transition-colors appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_16px_center] bg-no-repeat"
                                >
                                    {months.map(month => (
                                        <option key={month.value} value={month.value}>{month.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-6 flex gap-3">
                        <Button
                            onClick={handleSearch}
                            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200"
                        >
                            <Search className="w-4 h-4 mr-2" />
                            ค้นหา
                        </Button>
                        <Button
                            onClick={onClose}
                            variant="outline"
                            className="flex-1 h-12 border-2 border-red-200 text-red-500 hover:bg-red-50 rounded-xl font-bold"
                        >
                            ปิดหน้านี้
                        </Button>
                    </div>
                </div>
            </div>

            {/* Product Picker Modal */}
            <ProductPickerModal
                isOpen={isProductPickerOpen}
                onClose={() => setIsProductPickerOpen(false)}
                onSelect={handleProductSelect}
            />
        </>
    );
}
