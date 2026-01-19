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
    ArrowDownToLine,
    ArrowUpFromLine,
    ArrowLeftRight,
    Search,
} from "lucide-react";
import Link from "next/link";

async function getAllTransactions() {
    return prisma.transactionHeader.findMany({
        include: {
            documentType: true,
            createdByUser: {
                select: { username: true },
            },
            _count: { select: { details: true } },
        },
        orderBy: { docDate: "desc" },
        take: 100,
    });
}

export default async function TransactionsPage() {
    await auth();
    const transactions = await getAllTransactions();

    // Group by movement type
    const inbound = transactions.filter(t =>
        ["GR", "IN", "ADJ"].includes(t.docTypeCode)
    );
    const outbound = transactions.filter(t =>
        ["GI", "OUT"].includes(t.docTypeCode)
    );
    const transfers = transactions.filter(t =>
        ["TRN", "TF"].includes(t.docTypeCode)
    );

    const statusColors: Record<string, string> = {
        DRAFT: "bg-yellow-100 text-yellow-700",
        APPROVED: "bg-green-100 text-green-700",
        CANCELLED: "bg-red-100 text-red-700",
    };

    const statusLabels: Record<string, string> = {
        DRAFT: "รอดำเนินการ",
        APPROVED: "อนุมัติแล้ว",
        CANCELLED: "ยกเลิก",
    };

    const TransactionTable = ({ data }: { data: typeof transactions }) => (
        <Table>
            <TableHeader>
                <TableRow className="bg-slate-50">
                    <TableHead>เลขที่เอกสาร</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead>วันที่</TableHead>
                    <TableHead>คลัง</TableHead>
                    <TableHead>รายการ</TableHead>
                    <TableHead>ผู้สร้าง</TableHead>
                    <TableHead>สถานะ</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                            <Search className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                            ไม่พบเอกสารที่ค้นหา
                        </TableCell>
                    </TableRow>
                ) : (
                    data.map((tx) => (
                        <TableRow key={tx.id} className="hover:bg-slate-50">
                            <TableCell className="font-medium">
                                <Link href={`/transactions/${tx.id}`} className="text-blue-600 hover:underline">
                                    {tx.docNo}
                                </Link>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="text-xs">
                                    {tx.documentType?.docTypeName || tx.docTypeCode}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {new Date(tx.docDate).toLocaleDateString("th-TH")}
                            </TableCell>
                            <TableCell>{tx.whCode}</TableCell>
                            <TableCell>{tx._count.details} รายการ</TableCell>
                            <TableCell>{tx.createdByUser?.username || tx.createdUserName}</TableCell>
                            <TableCell>
                                <Badge className={statusColors[tx.docStatus] || ""}>
                                    {statusLabels[tx.docStatus] || tx.docStatus}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-7 h-7 text-slate-600" />
                    รายการเอกสาร
                </h1>
                <p className="text-slate-500">ดูรายการเอกสารทั้งหมดในระบบ</p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4 max-w-xl">
                    <TabsTrigger value="all" className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        ทั้งหมด
                    </TabsTrigger>
                    <TabsTrigger value="receive" className="flex items-center gap-1 text-green-700">
                        <ArrowDownToLine className="w-4 h-4" />
                        รับสินค้า
                    </TabsTrigger>
                    <TabsTrigger value="issue" className="flex items-center gap-1 text-orange-700">
                        <ArrowUpFromLine className="w-4 h-4" />
                        จ่ายสินค้า
                    </TabsTrigger>
                    <TabsTrigger value="transfer" className="flex items-center gap-1 text-blue-700">
                        <ArrowLeftRight className="w-4 h-4" />
                        โอนย้าย
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                    <Card className="border-0 shadow-sm mt-4">
                        <CardHeader>
                            <CardTitle className="text-lg">รายการเอกสาร ({transactions.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TransactionTable data={transactions} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="receive">
                    <Card className="border-0 shadow-sm mt-4">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ArrowDownToLine className="w-5 h-5 text-green-600" />
                                รับสินค้าเข้า ({inbound.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TransactionTable data={inbound} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="issue">
                    <Card className="border-0 shadow-sm mt-4">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ArrowUpFromLine className="w-5 h-5 text-orange-600" />
                                จ่ายสินค้าออก ({outbound.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TransactionTable data={outbound} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="transfer">
                    <Card className="border-0 shadow-sm mt-4">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ArrowLeftRight className="w-5 h-5 text-blue-600" />
                                โอนย้ายสินค้า ({transfers.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TransactionTable data={transfers} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
