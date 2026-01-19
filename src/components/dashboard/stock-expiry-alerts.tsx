"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Info, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface ExpiryItem {
    id: number;
    productCode: string;
    productName: string;
    whCode: string;
    whName: string;
    balance: number;
    mfgDate: Date;
    expDate: Date;
    daysUntilExpiry: number;
}

interface ExpiryWarnings {
    critical: ExpiryItem[];
    warning: ExpiryItem[];
    info: ExpiryItem[];
}

export function StockExpiryAlerts() {
    const [data, setData] = useState<ExpiryWarnings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchExpiryWarnings();
    }, []);

    const fetchExpiryWarnings = async () => {
        try {
            const response = await fetch("/api/stock/expiry-warnings");
            if (response.ok) {
                const result = await response.json();
                setData(result);
            }
        } catch (error) {
            console.error("Error fetching expiry warnings:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        );
    }

    if (!data) return null;

    const totalExpiring =
        data.critical.length + data.warning.length + data.info.length;

    if (totalExpiring === 0) {
        return (
            <Card className="border-0 shadow-sm bg-green-50 border-green-200">
                <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-green-100">
                            <Package className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-green-900">
                                สินค้าทั้งหมดอยู่ในสภาพดี
                            </h3>
                            <p className="text-sm text-green-700">
                                ไม่มีสินค้าที่ใกล้หมดอายุใน 90 วันข้างหน้า
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Critical Alert */}
            {data.critical.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-red-900">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            สินค้าใกล้หมดอายุ (ภายใน 30 วัน)
                            <Badge variant="destructive" className="ml-auto">
                                {data.critical.length} รายการ
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {data.critical.slice(0, 5).map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-100"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-sm text-slate-900">
                                            {item.productCode} - {item.productName}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {item.whName} • คงเหลือ {item.balance.toLocaleString()} ชิ้น
                                        </p>
                                    </div>
                                    <div className="text-right ml-4">
                                        <Badge variant="destructive" className="text-xs">
                                            {item.daysUntilExpiry} วัน
                                        </Badge>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {new Date(item.expDate).toLocaleDateString("th-TH")}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {data.critical.length > 5 && (
                                <Link
                                    href="/reports/stock-card"
                                    className="block text-center text-sm text-red-600 hover:text-red-700 font-medium mt-2"
                                >
                                    ดูทั้งหมด {data.critical.length} รายการ →
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Warning Alert */}
            {data.warning.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-orange-900">
                            <Clock className="w-5 h-5 text-orange-600" />
                            สินค้าใกล้หมดอายุ (31-60 วัน)
                            <Badge
                                variant="outline"
                                className="ml-auto border-orange-300 text-orange-700 bg-orange-100"
                            >
                                {data.warning.length} รายการ
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {data.warning.slice(0, 3).map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-100"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-sm text-slate-900">
                                            {item.productCode} - {item.productName}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {item.whName} • คงเหลือ {item.balance.toLocaleString()} ชิ้น
                                        </p>
                                    </div>
                                    <div className="text-right ml-4">
                                        <Badge
                                            variant="outline"
                                            className="text-xs border-orange-300 text-orange-700"
                                        >
                                            {item.daysUntilExpiry} วัน
                                        </Badge>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {new Date(item.expDate).toLocaleDateString("th-TH")}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {data.warning.length > 3 && (
                                <Link
                                    href="/reports/stock-card"
                                    className="block text-center text-sm text-orange-600 hover:text-orange-700 font-medium mt-2"
                                >
                                    ดูทั้งหมด {data.warning.length} รายการ →
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Info Alert */}
            {data.info.length > 0 && (
                <Card className="border-blue-200 bg-blue-50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
                            <Info className="w-5 h-5 text-blue-600" />
                            สินค้าใกล้หมดอายุ (61-90 วัน)
                            <Badge
                                variant="outline"
                                className="ml-auto border-blue-300 text-blue-700 bg-blue-100"
                            >
                                {data.info.length} รายการ
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-blue-700">
                            มีสินค้า {data.info.length} รายการที่จะหมดอายุในอีก 61-90 วัน
                            <Link
                                href="/reports/stock-card"
                                className="ml-2 text-blue-600 hover:text-blue-700 font-medium"
                            >
                                ดูรายละเอียด →
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
