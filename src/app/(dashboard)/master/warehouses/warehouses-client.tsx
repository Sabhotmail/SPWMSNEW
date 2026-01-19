"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Plus,
    Warehouse,
    MapPin,
    Package2,
    Loader2,
    MoreHorizontal,
    Pencil,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Location {
    id: number;
    locCode: string;
    locName: string | null;
}

interface WarehouseData {
    id: number;
    whCode: string;
    whName: string;
    branchCode: string | null;
    status: string;
    locations: Location[];
    _count: { stocks: number };
}

interface Branch {
    branchCode: string;
    branchName: string;
}

interface WarehousesClientProps {
    initialWarehouses: WarehouseData[];
    branches: Branch[];
    userRole: number;
}

export function WarehousesClient({
    initialWarehouses,
    branches,
    userRole,
}: WarehousesClientProps) {
    const [warehouses, setWarehouses] = useState<WarehouseData[]>(initialWarehouses);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<WarehouseData | null>(null);
    const [warehouseToDelete, setWarehouseToDelete] = useState<WarehouseData | null>(null);

    const [formData, setFormData] = useState({
        whCode: "",
        whName: "",
        branchCode: "",
    });

    const resetForm = () => {
        setFormData({ whCode: "", whName: "", branchCode: "" });
        setEditingWarehouse(null);
    };

    const handleOpenDialog = (wh?: WarehouseData) => {
        if (wh) {
            setEditingWarehouse(wh);
            setFormData({
                whCode: wh.whCode,
                whName: wh.whName,
                branchCode: wh.branchCode || "",
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const url = editingWarehouse
                ? `/api/warehouses/${editingWarehouse.id}`
                : "/api/warehouses";
            const method = editingWarehouse ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || `Failed to ${editingWarehouse ? 'update' : 'create'} warehouse`);
            }

            const result = await res.json();

            if (editingWarehouse) {
                setWarehouses(warehouses.map(w => w.id === editingWarehouse.id ? { ...w, ...result } : w));
                toast.success("อัปเดตคลังสินค้าสำเร็จ");
            } else {
                setWarehouses([...warehouses, { ...result, locations: [], _count: { stocks: 0 } }]);
                toast.success("เพิ่มคลังสินค้าสำเร็จ");
            }

            setIsDialogOpen(false);
            resetForm();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!warehouseToDelete) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/warehouses/${warehouseToDelete.id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to delete warehouse");
            }

            setWarehouses(warehouses.filter(w => w.id !== warehouseToDelete.id));
            toast.success("ลบคลังสินค้าสำเร็จ");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
        } finally {
            setIsLoading(false);
            setWarehouseToDelete(null);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <ConfirmDialog
                open={!!warehouseToDelete}
                onOpenChange={(open) => !open && setWarehouseToDelete(null)}
                title="ยืนยันการลบคลังสินค้า"
                description={`คุณต้องการลบคลังสินค้า ${warehouseToDelete?.whCode} (${warehouseToDelete?.whName}) หรือไม่? การลบนี้จะไม่สามารถย้อนกลับได้`}
                variant="danger"
                confirmText="ลบข้อมูล"
                onConfirm={handleDelete}
            />
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Warehouse className="w-7 h-7" />
                        จัดการคลังสินค้า
                    </h1>
                    <p className="text-slate-500">คลังสินค้าทั้งหมด {warehouses.length} แห่ง</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <Button onClick={() => handleOpenDialog()} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4 mr-2" />
                        เพิ่มคลังสินค้า
                    </Button>
                    <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                            <DialogTitle>{editingWarehouse ? 'แก้ไขคลังสินค้า' : 'เพิ่มคลังสินค้าใหม่'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="whCode">รหัสคลัง *</Label>
                                <Input
                                    id="whCode"
                                    value={formData.whCode}
                                    onChange={(e) => setFormData({ ...formData, whCode: e.target.value })}
                                    placeholder="WH01"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="whName">ชื่อคลังสินค้า *</Label>
                                <Input
                                    id="whName"
                                    value={formData.whName}
                                    onChange={(e) => setFormData({ ...formData, whName: e.target.value })}
                                    placeholder="คลังสินค้าหลัก"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="branchCode">สาขา</Label>
                                <select
                                    id="branchCode"
                                    value={formData.branchCode}
                                    onChange={(e) => setFormData({ ...formData, branchCode: e.target.value })}
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                >
                                    <option value="">เลือกสาขา</option>
                                    {branches.map((b) => (
                                        <option key={b.branchCode} value={b.branchCode}>
                                            {b.branchName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">ยกเลิก</Button>
                                </DialogClose>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    {editingWarehouse ? 'บันทึกการแก้ไข' : 'เพิ่มคลัง'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Warehouse Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {warehouses.map((wh) => (
                    <Card key={wh.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-purple-100">
                                        <Warehouse className="w-5 h-5 text-purple-600" />
                                    </div>
                                    {wh.whCode}
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                                        {wh.status}
                                    </Badge>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleOpenDialog(wh)}>
                                                <Pencil className="w-4 h-4 mr-2" />
                                                แก้ไข
                                            </DropdownMenuItem>
                                            {userRole >= 7 && (
                                                <DropdownMenuItem
                                                    onClick={() => setWarehouseToDelete(wh)}
                                                    className="text-red-600 focus:text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    ลบ
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="font-medium text-slate-900">{wh.whName}</p>

                            <div className="flex items-center gap-1">
                                <Package2 className="w-4 h-4" />
                                <span>{wh._count.stocks} รายการสต๊อก</span>
                            </div>

                        </CardContent>
                    </Card>
                ))}

                {warehouses.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        <Warehouse className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p>ยังไม่มีคลังสินค้า</p>
                    </div>
                )}
            </div>
        </div>
    );
}
