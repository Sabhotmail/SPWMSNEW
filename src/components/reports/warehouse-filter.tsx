"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Warehouse } from "lucide-react";

interface WarehouseFilterProps {
    warehouses: { whCode: string; whName: string }[];
    defaultValue: string;
}

export function WarehouseFilter({ warehouses, defaultValue }: WarehouseFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        const params = new URLSearchParams(searchParams.toString());

        if (val) {
            params.set("whCode", val);
        } else {
            params.delete("whCode");
        }

        // Push the new URL with updated whCode while preserving other params like 'view'
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-slate-400" />
            <select
                className="h-9 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all cursor-pointer hover:border-blue-400"
                value={defaultValue}
                onChange={handleChange}
            >
                <option value="">ทุกคลังสินค้า</option>
                {warehouses.map((wh) => (
                    <option key={wh.whCode} value={wh.whCode}>
                        {wh.whName}
                    </option>
                ))}
            </select>
        </div>
    );
}
