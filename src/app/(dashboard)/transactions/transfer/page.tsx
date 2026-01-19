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
import { Button } from "@/components/ui/button";
import {
    ArrowLeftRight,
    Plus,
    FileText,
} from "lucide-react";
import Link from "next/link";

async function getRecentTransactions() {
    return prisma.transactionHeader.findMany({
        where: {
            docTypeCode: { in: ["TRN", "TF"] } // รองรับทั้ง TRN และ TF
        },
        include: {
            documentType: true,
            createdByUser: {
                select: { username: true },
            },
            _count: { select: { details: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
    });
}

export default async function TransferPage() {
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
                        <ArrowLeftRight className="w-7 h-7 text-blue-600" />
                        โอนย้ายสินค้า
                    </h1>
                    <p className="text-slate-500">บันทึกการโอนย้ายระหว่างคลังสินค้า</p>
                </div>

                <Link href="/transactions/transfer/create">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        สร้างใบโอนย้าย
                    </Button>
                </Link>
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
                                <TableHead>ต้นทาง</TableHead>
                                <TableHead>ปลายทาง</TableHead>
                                <TableHead>รายการ</TableHead>
                                <TableHead>สถานะ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                        ยังไม่มีรายการโอนย้าย
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((tx) => (
                                    <TableRow key={tx.id} className="hover:bg-slate-50">
                                        <TableCell className="font-medium">
                                            <Link href={`/transactions/${tx.id}`} className="text-blue-600 hover:underline">
                                                {tx.docNo}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(tx.docDate).toLocaleDateString("th-TH")}
                                        </TableCell>
                                        <TableCell>{tx.whCode}</TableCell>
                                        <TableCell>{(tx as any).toWhCode || "-"}</TableCell>
                                        <TableCell>{tx._count.details} รายการ</TableCell>
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
