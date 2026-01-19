"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Printer,
    Loader2,
    Calendar,
    Warehouse as WarehouseIcon,
    User,
    Search,
    Trash2,
    Plus,
    Info,
    Edit2,
    Save,
    X,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Input } from "@/components/ui/input";
import { AddProductDialog, AddItemData } from "@/components/transactions/add-product-dialog";

interface TransactionViewClientProps {
    transaction: any;
    userRole: number;
    products: any[];
}

export function TransactionViewClient({ transaction, userRole, products }: TransactionViewClientProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);

    // Item management state
    const [searchQuery, setSearchQuery] = useState("");
    const [showProductList, setShowProductList] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    // Edit state
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<{
        qty: number;
        uomCode: string;
        uomRatio: number;
        lotNo: string;
        mfgDate: string;
        expDate: string;
        availableUoms: any[];
    } | null>(null);

    // Add product dialog state
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);

    const filteredProducts = products.filter(p =>
        p.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.productName.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);

    const handleSelectProduct = (product: any) => {
        setSelectedProduct(product);
        setShowAddDialog(true);
        setSearchQuery("");
        setShowProductList(false);
    };

    const handleAddItems = async (items: AddItemData[]) => {
        setIsLoading(true);
        try {
            for (const item of items) {
                const res = await fetch(`/api/transactions/${transaction.id}/details`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(item)
                });
                if (!res.ok) throw new Error("Failed to add item");
            }
            toast.success(`เพิ่มสินค้า ${items.length} รายการเรียบร้อย`);
            router.refresh();
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการเพิ่มสินค้า");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteItem = async () => {
        if (itemToDelete === null) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/transactions/${transaction.id}/details/${itemToDelete}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete item");
            toast.success("ลบรายการแล้ว");
            router.refresh();
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการลบ");
        } finally {
            setIsLoading(false);
            setItemToDelete(null);
        }
    };

    const handleEdit = async (item: any) => {
        setIsLoading(true);
        try {
            // Fetch UOMs
            const uomRes = await fetch(`/api/products/${item.productCode}/uoms`);
            const uomData = await uomRes.json();

            setEditingId(item.id);
            setEditForm({
                qty: Number(item.qty),
                uomCode: item.uomCode,
                uomRatio: item.uomRatio,
                lotNo: item.lotNo || "",
                mfgDate: item.mfgDate ? new Date(item.mfgDate).toISOString().split('T')[0] : "",
                expDate: item.expDate ? new Date(item.expDate).toISOString().split('T')[0] : "",
                availableUoms: uomData.uoms || [],
            });
        } catch (error) {
            toast.error("ไม่สามารถดึงข้อมูลหน่วยนับได้");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm(null);
    };

    const handleSaveEdit = async (id: number) => {
        if (!editForm) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/transactions/${transaction.id}/details/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    qty: editForm.qty,
                    uomCode: editForm.uomCode,
                    uomRatio: editForm.uomRatio,
                    // If UOM changed, recalculate pieceQty based on new ratio
                    pieceQty: editForm.qty * editForm.uomRatio,
                    lotNo: editForm.lotNo,
                    mfgDate: editForm.mfgDate || undefined,
                    expDate: editForm.expDate || undefined,
                })
            });

            if (!res.ok) throw new Error("Failed to update item");

            toast.success("บันทึกการแก้ไขแล้ว");
            setEditingId(null);
            setEditForm(null);
            router.refresh();
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการบันทึก");
        } finally {
            setIsLoading(false);
        }
    };

    const statusColors: Record<string, string> = {
        DRAFT: "bg-yellow-100 text-yellow-700 border-yellow-200",
        APPROVED: "bg-green-100 text-green-700 border-green-200",
        CANCELLED: "bg-red-100 text-red-700 border-red-200",
    };

    const handleApprove = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/transactions/${transaction.id}/approve`, {
                method: "POST",
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to approve");
            }

            toast.success("อนุมัติเอกสารเรียบร้อยแล้ว");
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/transactions/${transaction.id}/cancel`, {
                method: "POST",
            });

            if (!res.ok) throw new Error("Failed to cancel");

            toast.success("ยกเลิกเอกสารแล้ว");
            router.refresh();
        } catch {
            toast.error("เกิดข้อผิดพลาดในการยกเลิก");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            {transaction.docNo}
                            <Badge variant="outline" className={statusColors[transaction.docStatus]}>
                                {transaction.docStatus}
                            </Badge>
                        </h1>
                        <p className="text-slate-500">{transaction.documentType.docTypeName}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {transaction.docStatus === "DRAFT" && userRole >= 7 && (
                        <>
                            <Button
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => setShowCancelDialog(true)}
                                disabled={isLoading}
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                ยกเลิก
                            </Button>
                            <Button
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => setShowApproveDialog(true)}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                )}
                                อนุมัติรายการ
                            </Button>
                        </>
                    )}
                    <Button variant="outline">
                        <Printer className="w-4 h-4 mr-2" />
                        พิมพ์
                    </Button>
                </div>
            </div>

            {/* Document Info Info */}
            <Card className="border-0 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 bg-white">
                        <div className="p-4 flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Calendar className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">วันที่เอกสาร</p>
                                <p className="text-sm font-semibold">{new Date(transaction.docDate).toLocaleDateString("th-TH")}</p>
                            </div>
                        </div>

                        <div className="p-4 flex items-center gap-3">
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <WarehouseIcon className="w-5 h-5 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    {transaction.docTypeCode === "TRN" ? "คลังต้นทาง" : "คลังสินค้า"}
                                </p>
                                <p className="text-sm font-semibold truncate max-w-[150px]">
                                    {transaction.warehouse?.whName || transaction.whCode}
                                </p>
                            </div>
                        </div>

                        {transaction.docTypeCode === "TRN" ? (
                            <div className="p-4 flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 rounded-lg">
                                    <WarehouseIcon className="w-5 h-5 text-indigo-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">คลังปลายทาง</p>
                                    <p className="text-sm font-semibold truncate max-w-[150px]">
                                        {transaction.toWarehouse?.whName || transaction.toWhCode}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 flex items-center gap-3">
                                <div className="p-2 bg-slate-50 rounded-lg">
                                    <User className="w-5 h-5 text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">ผู้สร้างรายการ</p>
                                    <p className="text-sm font-semibold truncate max-w-[150px]">
                                        {transaction.createdByUser?.username || transaction.createdBy}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className={`p-4 flex items-center gap-3 ${transaction.remark ? 'bg-amber-50/30' : ''}`}>
                            <div className="p-2 bg-white border rounded-lg">
                                <Info className="w-5 h-5 text-slate-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">หมายเหตุ</p>
                                <p className="text-sm font-semibold truncate italic text-slate-600">
                                    {transaction.remark || "-"}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6">
                {/* Details Table */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">รายการสินค้า</CardTitle>
                        {transaction.docStatus === "DRAFT" && (
                            <div className="relative">
                                <div className="flex items-center border rounded-md px-2 bg-slate-50">
                                    <Search className="w-4 h-4 text-slate-400 mr-2" />
                                    <Input
                                        placeholder="เพิ่มสินค้า (รหัส/ชื่อ)..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setShowProductList(true);
                                        }}
                                        onFocus={() => setShowProductList(true)}
                                        className="border-0 bg-transparent focus-visible:ring-0 w-[200px] h-8 text-sm"
                                    />
                                    <Plus className="w-4 h-4 text-blue-500 ml-1" />
                                </div>
                                {showProductList && searchQuery && (
                                    <div className="absolute top-full right-0 mt-1 w-[320px] bg-white border rounded-md shadow-xl z-50 overflow-hidden">
                                        {filteredProducts.length > 0 ? (
                                            filteredProducts.map(p => (
                                                <div
                                                    key={p.id}
                                                    className="p-3 hover:bg-slate-50 cursor-pointer text-sm border-b last:border-0 group flex items-center justify-between"
                                                    onClick={() => handleSelectProduct(p)}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-bold text-blue-700">{p.productCode}</div>
                                                        <div className="text-slate-500 truncate">{p.productName}</div>
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Plus className="w-4 h-4 text-blue-500" />
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-sm text-slate-500">ไม่พบสินค้า</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        {transaction.details.length === 0 ? (
                            <div className="border-2 border-dashed border-slate-200 rounded-lg py-12 text-center">
                                <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-slate-500 text-sm italic">ยังไม่มีรายการสินค้า</p>
                                {transaction.docStatus === "DRAFT" && (
                                    <p className="text-slate-400 text-xs mt-1">กรุณาเพิ่มสินค้าจากช่องค้นหาด้านบน</p>
                                )}
                            </div>
                        ) : (
                            <div className="border rounded-md overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50">
                                            <TableHead className="w-12">ลำดับ</TableHead>
                                            <TableHead>สินค้า</TableHead>
                                            <TableHead className="text-right">จำนวน</TableHead>
                                            <TableHead>หน่วย</TableHead>
                                            {transaction.docTypeCode === "GR" && <TableHead>Lot/MFG</TableHead>}
                                            {transaction.docStatus === "DRAFT" && <TableHead className="w-10"></TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transaction.details.map((item: any, index: number) => (
                                            <TableRow key={item.id} className="hover:bg-slate-50/50">
                                                <TableCell className="text-slate-400 text-xs">{index + 1}</TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{item.productCode}</div>
                                                    <div className="text-xs text-slate-500 line-clamp-1">{item.product?.productName}</div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {item.remark ? (
                                                        <div>
                                                            <span className="font-bold text-blue-600">{item.remark}</span>
                                                            <div className="text-[10px] text-slate-400">= {Number(item.qty).toLocaleString()} ชิ้น</div>
                                                        </div>
                                                    ) : (
                                                        <span className="font-bold text-blue-600">{Number(item.uomQty || item.qty).toLocaleString()}</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs font-medium">{item.remark ? "" : item.uomCode}</div>
                                                </TableCell>
                                                {transaction.docTypeCode === "GR" && (
                                                    <TableCell>
                                                        <div className="text-[10px] leading-tight text-slate-500">
                                                            {item.lotNo && <p><span className="font-semibold">Lot:</span> {item.lotNo}</p>}
                                                            {item.mfgDate && <p><span className="font-semibold">MFG:</span> {new Date(item.mfgDate).toLocaleDateString("th-TH")}</p>}
                                                        </div>
                                                    </TableCell>
                                                )}
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-blue-400 hover:text-blue-600 hover:bg-blue-50"
                                                            onClick={() => handleEdit(item)}
                                                            disabled={isLoading || editingId !== null}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => setItemToDelete(item.id)}
                                                            disabled={isLoading || editingId !== null}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}

                                        {/* Editing Row Overlay - Using map effectively by checking state */}
                                        {editingId && transaction.details.find((d: any) => d.id === editingId) && (
                                            (() => {
                                                const item = transaction.details.find((d: any) => d.id === editingId)!;
                                                return (
                                                    <TableRow className="bg-blue-50/50 absolute-ish border-2 border-blue-200">
                                                        <TableCell className="text-slate-400 text-xs">#</TableCell>
                                                        <TableCell>
                                                            <div className="font-medium">{item.productCode}</div>
                                                            <div className="text-xs text-slate-500 line-clamp-1">{item.product?.productName}</div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                className="h-8 w-24 text-right"
                                                                value={editForm?.qty || 0}
                                                                onChange={(e) => setEditForm(prev => prev ? { ...prev, qty: Number(e.target.value) } : null)}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <select
                                                                className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                                value={editForm?.uomCode}
                                                                onChange={(e) => {
                                                                    const selected = editForm?.availableUoms.find((u: any) => u.uomCode === e.target.value);
                                                                    if (selected) {
                                                                        setEditForm(prev => prev ? { ...prev, uomCode: selected.uomCode, uomRatio: selected.uomRatio } : null);
                                                                    }
                                                                }}
                                                            >
                                                                {editForm?.availableUoms.map((u: any) => (
                                                                    <option key={u.uomCode} value={u.uomCode}>
                                                                        {u.uomCode} ({u.uomRatio})
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </TableCell>
                                                        {transaction.docTypeCode === "GR" && (
                                                            <TableCell>
                                                                <div className="space-y-1">
                                                                    <Input
                                                                        placeholder="Lot No."
                                                                        className="h-7 text-xs"
                                                                        value={editForm?.lotNo || ""}
                                                                        onChange={(e) => setEditForm(prev => prev ? { ...prev, lotNo: e.target.value } : null)}
                                                                    />
                                                                    <div className="grid grid-cols-2 gap-1">
                                                                        <div>
                                                                            <span className="text-[10px] text-slate-400">MFG</span>
                                                                            <Input
                                                                                type="date"
                                                                                className="h-7 text-xs px-1"
                                                                                value={editForm?.mfgDate || ""}
                                                                                onChange={(e) => setEditForm(prev => prev ? { ...prev, mfgDate: e.target.value } : null)}
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-[10px] text-slate-400">EXP</span>
                                                                            <Input
                                                                                type="date"
                                                                                className="h-7 text-xs px-1"
                                                                                value={editForm?.expDate || ""}
                                                                                onChange={(e) => setEditForm(prev => prev ? { ...prev, expDate: e.target.value } : null)}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                        )}
                                                        <TableCell>
                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    size="icon"
                                                                    className="h-7 w-7 bg-green-600 hover:bg-green-700 text-white"
                                                                    onClick={() => handleSaveEdit(item.id)}
                                                                    disabled={isLoading}
                                                                >
                                                                    <Save className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-slate-400 hover:text-slate-600"
                                                                    onClick={handleCancelEdit}
                                                                    disabled={isLoading}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })()
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            {/* Confirm Dialogs */}
            <ConfirmDialog
                open={itemToDelete !== null}
                onOpenChange={(open) => !open && setItemToDelete(null)}
                title="ยืนยันการลบรายการ"
                description="คุณต้องการลบรายการสินค้านี้ออกจากเอกสารใช่หรือไม่?"
                variant="danger"
                onConfirm={handleDeleteItem}
            />

            <ConfirmDialog
                open={showApproveDialog}
                onOpenChange={setShowApproveDialog}
                title="ยืนยันการอนุมัติเอกสาร"
                description="เมื่ออนุมัติแล้ว ระบบจะทำการปรับยอดสต๊อกสินค้าทันทีและไม่สามารถแก้ไขได้อีก คุณต้องการดำเนินการต่อหรือไม่?"
                variant="warning"
                onConfirm={handleApprove}
            />

            <ConfirmDialog
                open={showCancelDialog}
                onOpenChange={setShowCancelDialog}
                title="ยืนยันการยกเลิกเอกสาร"
                description="คุณต้องการยกเลิกเอกสารนี้ใช่หรือไม่? การยกเลิกจะไม่สามารถย้อนกลับได้"
                variant="danger"
                onConfirm={handleCancel}
            />

            {/* Add Product Dialog */}
            <AddProductDialog
                isOpen={showAddDialog}
                onClose={() => {
                    setShowAddDialog(false);
                    setSelectedProduct(null);
                }}
                onConfirm={handleAddItems}
                product={selectedProduct}
                isInbound={transaction.docTypeCode === "GR" || transaction.docTypeCode === "IN" || transaction.docTypeCode === "ADJ"}
                whCode={transaction.whCode}
            />
        </div>
    );
}
