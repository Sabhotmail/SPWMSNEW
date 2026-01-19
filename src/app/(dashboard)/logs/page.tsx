import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    FileText,
    Activity,
    Package,
    User,
    Clock,
    CheckCircle,
    XCircle,
    Edit,
    PlusCircle,
    Trash2,
} from "lucide-react";

async function getActivityLogs() {
    try {
        return await prisma.activityLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 100,
        });
    } catch {
        return [];
    }
}

async function getStockLogs() {
    try {
        return await prisma.stockLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 100,
        });
    } catch {
        return [];
    }
}

const actionIcons: Record<string, any> = {
    APPROVE: CheckCircle,
    CANCEL: XCircle,
    CREATE: PlusCircle,
    UPDATE: Edit,
    DELETE: Trash2,
    LOGIN: User,
    LOGOUT: User,
};

const actionColors: Record<string, string> = {
    APPROVE: "bg-green-100 text-green-700",
    APPROVE_IN: "bg-green-100 text-green-700",
    APPROVE_OUT: "bg-green-100 text-green-700",
    APPROVE_ADJ: "bg-green-100 text-green-700",
    APPROVE_TRN: "bg-green-100 text-green-700",
    APPROVE_GR: "bg-green-100 text-green-700",
    APPROVE_GI: "bg-green-100 text-green-700",
    CANCEL: "bg-red-100 text-red-700",
    CREATE: "bg-blue-100 text-blue-700",
    UPDATE: "bg-yellow-100 text-yellow-700",
    DELETE: "bg-red-100 text-red-700",
    LOGIN: "bg-purple-100 text-purple-700",
    LOGOUT: "bg-gray-100 text-gray-700",
};

const actionLabels: Record<string, string> = {
    APPROVE: "อนุมัติ",
    APPROVE_IN: "อนุมัติรับสินค้า",
    APPROVE_OUT: "อนุมัติจ่ายสินค้า",
    APPROVE_ADJ: "อนุมัติปรับปรุง",
    APPROVE_TRN: "อนุมัติโอนย้าย",
    APPROVE_GR: "อนุมัติรับสินค้า (GR)",
    APPROVE_GI: "อนุมัติจ่ายสินค้า (GI)",
    CANCEL: "ยกเลิกเอกสาร",
    CREATE: "สร้างข้อมูล",
    UPDATE: "แก้ไขข้อมูล",
    DELETE: "ลบข้อมูล",
    LOGIN: "เข้าสู่ระบบ",
    LOGOUT: "ออกจากระบบ",
};

export default async function LogsPage() {
    await auth();

    const [activityLogs, stockLogs] = await Promise.all([
        getActivityLogs(),
        getStockLogs(),
    ]);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-7 h-7 text-indigo-600" />
                    ประวัติการทำงาน
                </h1>
                <p className="text-slate-500">ดูประวัติการกระทำและการเปลี่ยนแปลงสต๊อกในระบบ</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-100">
                                <Activity className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Activity Logs</p>
                                <p className="text-xl font-bold">{activityLogs.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-100">
                                <Package className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Stock Logs</p>
                                <p className="text-xl font-bold">{stockLogs.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-100">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">การอนุมัติ</p>
                                <p className="text-xl font-bold">
                                    {activityLogs.filter((l: any) => l.action.startsWith("APPROVE")).length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="activity" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="activity" className="flex items-center gap-1">
                        <Activity className="w-4 h-4" />
                        Activity Log
                    </TabsTrigger>
                    <TabsTrigger value="stock" className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        Stock Log
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="activity">
                    <Card className="border-0 shadow-sm mt-4">
                        <CardHeader>
                            <CardTitle className="text-lg">ประวัติการกระทำ</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead>วันเวลา</TableHead>
                                        <TableHead>ผู้ใช้</TableHead>
                                        <TableHead>การกระทำ</TableHead>
                                        <TableHead>โมดูล</TableHead>
                                        <TableHead>เลขที่เอกสาร</TableHead>
                                        <TableHead>รายละเอียด</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activityLogs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                                ยังไม่มีประวัติการกระทำ
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        activityLogs.map((log: any) => {
                                            const IconComponent = actionIcons[log.action] || FileText;
                                            return (
                                                <TableRow key={log.id} className="hover:bg-slate-50">
                                                    <TableCell className="text-sm text-slate-600">
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(log.createdAt).toLocaleString("th-TH")}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            <User className="w-3 h-3" />
                                                            {log.username}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={actionColors[log.action] || "bg-gray-100"}>
                                                            <IconComponent className="w-3 h-3 mr-1" />
                                                            {actionLabels[log.action] || log.action}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{log.module}</Badge>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-sm">
                                                        {log.docNo || "-"}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-slate-600 max-w-xs truncate">
                                                        {log.description || "-"}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="stock">
                    <Card className="border-0 shadow-sm mt-4">
                        <CardHeader>
                            <CardTitle className="text-lg">ประวัติการเปลี่ยนแปลงสต๊อก</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead>วันเวลา</TableHead>
                                        <TableHead>ประเภท</TableHead>
                                        <TableHead>เลขที่เอกสาร</TableHead>
                                        <TableHead>รหัสสินค้า</TableHead>
                                        <TableHead>คลัง</TableHead>
                                        <TableHead className="text-right">ยอดเดิม</TableHead>
                                        <TableHead className="text-right">เปลี่ยนแปลง</TableHead>
                                        <TableHead className="text-right">ยอดใหม่</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stockLogs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                                                ยังไม่มีประวัติการเปลี่ยนแปลงสต๊อก
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        stockLogs.map((log: any) => {
                                            const isFuture = log.functionName.startsWith("FUTURE");
                                            const isApprove = log.functionName.startsWith("APPROVE");

                                            const typeLabel = log.functionName === "FUTURE_IN" ? "จองรับเข้า" :
                                                log.functionName === "FUTURE_OUT" ? "จองจ่ายออก" :
                                                    log.functionName === "APPROVE_IN" ? "รับเข้าจริง" :
                                                        log.functionName === "APPROVE_OUT" ? "จ่ายออกจริง" :
                                                            log.functionName === "APPROVE_TRN" ? "โอนย้ายจริง" :
                                                                log.functionName === "CANCEL_IN" ? "ยกเลิกรับเข้า" :
                                                                    log.functionName === "CANCEL_OUT" ? "ยกเลิกจ่ายออก" :
                                                                        log.functionName;

                                            return (
                                                <TableRow key={log.id} className="hover:bg-slate-50">
                                                    <TableCell className="text-sm text-slate-600">
                                                        {new Date(log.createdAt).toLocaleString("th-TH")}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={
                                                            isFuture ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                                isApprove ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                                    "bg-slate-50 text-slate-600"
                                                        }>
                                                            {typeLabel}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-sm">
                                                        {log.docNo}
                                                    </TableCell>
                                                    <TableCell>{log.productCode}</TableCell>
                                                    <TableCell>{log.whCode}</TableCell>
                                                    <TableCell className="text-right">{log.balanceOld.toLocaleString()}</TableCell>
                                                    <TableCell className={`text-right font-medium ${isFuture ? "text-blue-400" :
                                                            log.pieceQty > 0 ? "text-green-600" :
                                                                log.pieceQty < 0 ? "text-red-600" : "text-slate-400"
                                                        }`}>
                                                        {isFuture ? "(" : ""}{log.pieceQty > 0 ? '+' : ''}{log.pieceQty.toLocaleString()}{isFuture ? ")" : ""}
                                                    </TableCell>
                                                    <TableCell className={`text-right font-medium ${isFuture ? "text-slate-400" : "text-slate-900"}`}>
                                                        {log.balanceNew.toLocaleString()}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
