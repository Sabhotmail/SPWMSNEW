import { auth } from "@/lib/auth";
import Link from "next/link";
import {
    BarChart3,
    Package,
    ArrowRightLeft,
    Calendar,
    FileText,
    Layers,
    TrendingUp,
    AlertTriangle
} from "lucide-react";

export default async function ReportsPage() {
    await auth();

    const reportCategories = [
        {
            title: "รายงานสต็อก",
            description: "ตรวจสอบยอดคงเหลือและสถานะสินค้า",
            icon: Package,
            color: "from-blue-500 to-blue-600",
            reports: [
                {
                    name: "รายงานยอดคงเหลือ",
                    description: "ยอดสต็อกปัจจุบันแยกตามคลัง",
                    href: "/reports/stock-balance",
                    icon: BarChart3,
                },
                // ซ่อนสต็อกการ์ดไว้ก่อน
                // {
                //     name: "สต็อกการ์ด (สรุป)",
                //     description: "ยอดสต็อกแยกตามล็อต MFG/EXP",
                //     href: "/reports/stock-card",
                //     icon: Layers,
                // },
            ]
        },
        {
            title: "รายงานการเคลื่อนไหว",
            description: "ติดตามประวัติการรับ-จ่ายสินค้า",
            icon: ArrowRightLeft,
            color: "from-purple-500 to-purple-600",
            reports: [
                {
                    name: "1. การเคลื่อนไหวสินค้า",
                    description: "ประวัติการเดินรายการสินค้า",
                    href: "/reports/stock-movement",
                    icon: TrendingUp,
                },
                {
                    name: "2. การเคลื่อนไหวสินค้า (วันที่ผลิต/หมดอายุ)",
                    description: "ประวัติแยกตามล็อต MFG/EXP",
                    href: "/reports/stock-card-detail",
                    icon: Calendar,
                },
            ]
        },
    ];

    return (
        <div className="p-6 space-y-8 bg-slate-50/50 min-h-screen">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-black text-slate-900">
                    <FileText className="inline-block w-8 h-8 mr-2 text-indigo-600" />
                    รายงาน
                </h1>
                <p className="text-slate-500">เลือกประเภทรายงานที่ต้องการดู</p>
            </div>

            {/* Report Categories */}
            <div className="max-w-4xl mx-auto space-y-8">
                {reportCategories.map((category, idx) => (
                    <div key={idx} className="space-y-4">
                        {/* Category Header */}
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${category.color} text-white shadow-lg`}>
                                <category.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">{category.title}</h2>
                                <p className="text-sm text-slate-500">{category.description}</p>
                            </div>
                        </div>

                        {/* Report Buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {category.reports.map((report, rIdx) => (
                                <Link
                                    key={rIdx}
                                    href={report.href}
                                    className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${category.color} p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]`}
                                >
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-2">
                                            <report.icon className="w-6 h-6" />
                                            <h3 className="text-lg font-bold">{report.name}</h3>
                                        </div>
                                        <p className="text-white/80 text-sm">{report.description}</p>
                                    </div>

                                    {/* Background decoration */}
                                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                                    <div className="absolute right-4 bottom-4 opacity-20 group-hover:opacity-30 transition-opacity">
                                        <report.icon className="w-16 h-16" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Stats Section */}
            <div className="max-w-4xl mx-auto pt-8">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-amber-100 rounded-xl">
                            <AlertTriangle className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-900">คำแนะนำ</h3>
                            <p className="text-amber-700 text-sm mt-1">
                                สำหรับรายงานการเคลื่อนไหว กรุณาระบุรหัสสินค้าและช่วงเวลาที่ต้องการดู
                                ระบบจะคำนวณยอดคงเหลือสะสมให้อัตโนมัติ
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
