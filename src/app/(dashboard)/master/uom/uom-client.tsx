"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Ruler, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UOM {
    id: number;
    uomCode: string;
    uomName: string;
    status: string;
}

export function UOMClient() {
    const [uoms, setUoms] = useState<UOM[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newCode, setNewCode] = useState("");
    const [newName, setNewName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const fetchUOMs = async () => {
        try {
            const res = await fetch("/api/uoms");
            const data = await res.json();
            setUoms(data);
        } catch (error) {
            toast.error("ไม่สามารถโหลดข้อมูลได้");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUOMs();
    }, []);

    const handleCreate = async () => {
        if (!newCode || !newName) {
            toast.error("กรุณากรอกข้อมูลให้ครบ");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch("/api/uoms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uomCode: newCode, uomName: newName }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error);
            }

            toast.success("เพิ่มหน่วยนับเรียบร้อย");
            setNewCode("");
            setNewName("");
            setIsDialogOpen(false);
            fetchUOMs();
        } catch (error: any) {
            toast.error(error.message || "เกิดข้อผิดพลาด");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Ruler className="w-7 h-7 text-purple-600" />
                        หน่วยนับ (UOM)
                    </h1>
                    <p className="text-slate-500">จัดการหน่วยนับสินค้า</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-purple-600 hover:bg-purple-700">
                            <Plus className="w-4 h-4 mr-2" />
                            เพิ่มหน่วยนับ
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>เพิ่มหน่วยนับใหม่</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div>
                                <label className="text-sm font-medium">รหัสหน่วยนับ *</label>
                                <Input
                                    placeholder="เช่น PCS, BOX, KG"
                                    value={newCode}
                                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">ชื่อหน่วยนับ *</label>
                                <Input
                                    placeholder="เช่น ชิ้น, กล่อง, กิโลกรัม"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleCreate} disabled={isSaving} className="w-full">
                                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                บันทึก
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">รายการหน่วยนับ ({uoms.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead>รหัส</TableHead>
                                    <TableHead>ชื่อหน่วยนับ</TableHead>
                                    <TableHead>สถานะ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {uoms.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                                            ยังไม่มีข้อมูลหน่วยนับ
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    uoms.map((uom) => (
                                        <TableRow key={uom.id}>
                                            <TableCell className="font-mono font-bold">{uom.uomCode}</TableCell>
                                            <TableCell>{uom.uomName}</TableCell>
                                            <TableCell>
                                                <Badge className={uom.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                                                    {uom.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
