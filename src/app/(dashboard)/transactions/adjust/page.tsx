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
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileEdit, Plus, FileText } from "lucide-react";
import Link from "next/link";

async function getRecentTransactions() {
    return prisma.transactionHeader.findMany({
        where: { docTypeCode: "ADJ" },
        include: {
            documentType: true,
            createdByUser: { select: { username: true } },
            _count: { select: { details: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
    });
}

export default async function AdjustPage() {
    await auth();
    const transactions = await getRecentTransactions();

    const statusColors: Record<string, string> = {
        DRAFT: "bg-yellow-100 text-yellow-700",
        APPROVED: "bg-green-100 text-green-700",
        CANCELLED: "bg-red-100 text-red-700",
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileEdit className="w-7 h-7 text-violet-600" />
                        ปรับปรุงสต็อก
                    </h1>
                    <p className="text-slate-500">ADJ — ปรับปรุงเพิ่ม/ลด ตามประเภทการเคลื่อนไหว</p>
                </div>
                <Link href="/transactions/adjust/create">
                    <Button className="bg-violet-600 hover:bg-violet-700">
                        <Plus className="w-4 h-4 mr-2" />
                        สร้างใบปรับปรุง
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-yellow-100">
                                <FileText className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">รอดำเนินการ</p>
                                <p className="text-xl font-bold">
                                    {transactions.filter((t) => t.docStatus === "DRAFT").length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-100">
                                <FileText className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">อนุมัติแล้ว</p>
                                <p className="text-xl font-bold">
                                    {transactions.filter((t) => t.docStatus === "APPROVED").length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-violet-100">
                                <FileText className="w-5 h-5 text-violet-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">ทั้งหมด</p>
                                <p className="text-xl font-bold">{transactions.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">รายการล่าสุด</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead>เลขที่เอกสาร</TableHead>
                                <TableHead>วันที่</TableHead>
                                <TableHead>คลัง</TableHead>
                                <TableHead>รายการ</TableHead>
                                <TableHead>ผู้สร้าง</TableHead>
                                <TableHead>สถานะ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                        ยังไม่มีรายการ
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((tx) => (
                                    <TableRow key={tx.id} className="hover:bg-slate-50">
                                        <TableCell className="font-medium">
                                            <Link
                                                href={`/transactions/${tx.id}`}
                                                className="text-blue-600 hover:underline"
                                            >
                                                {tx.docNo}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(tx.docDate).toLocaleDateString("th-TH")}
                                        </TableCell>
                                        <TableCell>{tx.whCode}</TableCell>
                                        <TableCell>{tx._count.details} รายการ</TableCell>
                                        <TableCell>{tx.createdByUser?.username}</TableCell>
                                        <TableCell>
                                            <Badge className={statusColors[tx.docStatus] || ""}>
                                                {tx.docStatus}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
