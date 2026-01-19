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
import {
    FileText,
    ArrowDownToLine,
    ArrowUpFromLine,
    ArrowLeftRight,
    Search,
} from "lucide-react";
import Link from "next/link";

async function getAllDocuments(status?: string, docType?: string) {
    const where: any = {};

    if (status) {
        where.docStatus = status;
    }
    if (docType) {
        // Map new doc types to include legacy equivalents
        const docTypeMap: Record<string, string[]> = {
            'GR': ['GR', 'IN'],      // รับสินค้า
            'GI': ['GI', 'OUT'],      // จ่ายสินค้า
            'TRN': ['TRN', 'TF'],     // โอนย้าย
        };
        const mappedTypes = docTypeMap[docType] || [docType];
        where.docTypeCode = { in: mappedTypes };
    }

    return prisma.transactionHeader.findMany({
        where,
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

async function getDocumentStats() {
    const [total, draft, approved, cancelled] = await Promise.all([
        prisma.transactionHeader.count(),
        prisma.transactionHeader.count({ where: { docStatus: "DRAFT" } }),
        prisma.transactionHeader.count({ where: { docStatus: "APPROVED" } }),
        prisma.transactionHeader.count({ where: { docStatus: "CANCELLED" } }),
    ]);
    return { total, draft, approved, cancelled };
}

export default async function DocumentsPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; docType?: string }>;
}) {
    await auth();
    const { status, docType } = await searchParams;

    const [documents, stats] = await Promise.all([
        getAllDocuments(status, docType),
        getDocumentStats(),
    ]);

    const statusColors: Record<string, string> = {
        DRAFT: "bg-yellow-100 text-yellow-700",
        APPROVED: "bg-green-100 text-green-700",
        CANCELLED: "bg-red-100 text-red-700",
    };

    const docTypeIcons: Record<string, any> = {
        GR: ArrowDownToLine,
        GI: ArrowUpFromLine,
        TRN: ArrowLeftRight,
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-7 h-7 text-slate-600" />
                    เอกสารทั้งหมด
                </h1>
                <p className="text-slate-500">รวมเอกสารรับ-จ่าย-โอนย้ายทั้งหมด</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/documents">
                    <Card className={`border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${!status ? 'ring-2 ring-blue-500' : ''}`}>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                            <p className="text-xs text-slate-500">ทั้งหมด</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/documents?status=DRAFT">
                    <Card className={`border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${status === 'DRAFT' ? 'ring-2 ring-yellow-500' : ''}`}>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
                            <p className="text-xs text-slate-500">รอดำเนินการ</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/documents?status=APPROVED">
                    <Card className={`border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${status === 'APPROVED' ? 'ring-2 ring-green-500' : ''}`}>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                            <p className="text-xs text-slate-500">อนุมัติแล้ว</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/documents?status=CANCELLED">
                    <Card className={`border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${status === 'CANCELLED' ? 'ring-2 ring-red-500' : ''}`}>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                            <p className="text-xs text-slate-500">ยกเลิก</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Filter by Doc Type */}
            <div className="flex gap-2">
                <Link href={status ? `/documents?status=${status}` : "/documents"}>
                    <Badge variant={!docType ? "default" : "outline"} className="cursor-pointer px-3 py-1">
                        ทั้งหมด
                    </Badge>
                </Link>
                <Link href={status ? `/documents?status=${status}&docType=GR` : "/documents?docType=GR"}>
                    <Badge variant={docType === "GR" ? "default" : "outline"} className="cursor-pointer px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200">
                        <ArrowDownToLine className="w-3 h-3 mr-1" /> รับสินค้า
                    </Badge>
                </Link>
                <Link href={status ? `/documents?status=${status}&docType=GI` : "/documents?docType=GI"}>
                    <Badge variant={docType === "GI" ? "default" : "outline"} className="cursor-pointer px-3 py-1 bg-orange-100 text-orange-700 hover:bg-orange-200">
                        <ArrowUpFromLine className="w-3 h-3 mr-1" /> จ่ายสินค้า
                    </Badge>
                </Link>
                <Link href={status ? `/documents?status=${status}&docType=TRN` : "/documents?docType=TRN"}>
                    <Badge variant={docType === "TRN" ? "default" : "outline"} className="cursor-pointer px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200">
                        <ArrowLeftRight className="w-3 h-3 mr-1" /> โอนย้าย
                    </Badge>
                </Link>
            </div>

            {/* Documents Table */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">
                        รายการเอกสาร ({documents.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
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
                            {documents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                                        <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                        <p>ไม่พบเอกสารที่ค้นหา</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                documents.map((doc) => {
                                    const IconComponent = docTypeIcons[doc.docTypeCode] || FileText;
                                    return (
                                        <TableRow key={doc.id} className="hover:bg-slate-50">
                                            <TableCell className="font-medium">
                                                <Link href={`/transactions/${doc.id}`} className="text-blue-600 hover:underline flex items-center gap-2">
                                                    <IconComponent className="w-4 h-4" />
                                                    {doc.docNo}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        doc.documentType.movementType === "IN"
                                                            ? "border-green-300 text-green-700"
                                                            : doc.documentType.movementType === "OUT"
                                                                ? "border-orange-300 text-orange-700"
                                                                : "border-blue-300 text-blue-700"
                                                    }
                                                >
                                                    {doc.documentType.docTypeName}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(doc.docDate).toLocaleDateString("th-TH")}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs">
                                                    <p>{doc.whCode}</p>
                                                    {doc.docTypeCode === "TRN" && (
                                                        <p className="text-slate-400">→ {(doc as any).toWhCode}</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{doc._count.details} รายการ</TableCell>
                                            <TableCell className="text-sm text-slate-600">
                                                {doc.createdByUser?.username}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={statusColors[doc.docStatus] || ""}>
                                                    {doc.docStatus === "DRAFT" ? "รอดำเนินการ" :
                                                        doc.docStatus === "APPROVED" ? "อนุมัติ" : "ยกเลิก"}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
