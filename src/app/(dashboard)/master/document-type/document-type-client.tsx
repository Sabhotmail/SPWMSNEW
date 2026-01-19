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
import { Plus, FileType, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DocumentType {
    id: number;
    docTypeCode: string;
    docTypeName: string;
    movementType: string;
    status: string;
}

export function DocumentTypeClient() {
    const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newCode, setNewCode] = useState("");
    const [newName, setNewName] = useState("");
    const [movementType, setMovementType] = useState("IN");
    const [isSaving, setIsSaving] = useState(false);

    const fetchDocTypes = async () => {
        try {
            const res = await fetch("/api/document-types");
            const data = await res.json();
            setDocTypes(data);
        } catch (error) {
            toast.error("ไม่สามารถโหลดข้อมูลได้");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDocTypes();
    }, []);

    const handleCreate = async () => {
        if (!newCode || !newName) {
            toast.error("กรุณากรอกข้อมูลให้ครบ");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch("/api/document-types", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ docTypeCode: newCode, docTypeName: newName, movementType }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error);
            }

            toast.success("เพิ่มประเภทเอกสารเรียบร้อย");
            setNewCode("");
            setNewName("");
            setMovementType("IN");
            setIsDialogOpen(false);
            fetchDocTypes();
        } catch (error: any) {
            toast.error(error.message || "เกิดข้อผิดพลาด");
        } finally {
            setIsSaving(false);
        }
    };

    const movementColors: Record<string, string> = {
        IN: "bg-green-100 text-green-700",
        OUT: "bg-orange-100 text-orange-700",
        TRN: "bg-blue-100 text-blue-700",
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileType className="w-7 h-7 text-teal-600" />
                        ประเภทเอกสาร
                    </h1>
                    <p className="text-slate-500">จัดการประเภทเอกสารธุรกรรม</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-teal-600 hover:bg-teal-700">
                            <Plus className="w-4 h-4 mr-2" />
                            เพิ่มประเภท
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>เพิ่มประเภทเอกสารใหม่</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div>
                                <label className="text-sm font-medium">รหัสประเภท *</label>
                                <Input
                                    placeholder="เช่น GR, GI, TRN"
                                    value={newCode}
                                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">ชื่อประเภท *</label>
                                <Input
                                    placeholder="เช่น ใบรับสินค้า, ใบจ่ายสินค้า"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">ประเภทการเคลื่อนไหว *</label>
                                <select
                                    value={movementType}
                                    onChange={(e) => setMovementType(e.target.value)}
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                >
                                    <option value="IN">IN (รับเข้า)</option>
                                    <option value="OUT">OUT (จ่ายออก)</option>
                                    <option value="TRN">TRN (โอนย้าย)</option>
                                </select>
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
                    <CardTitle className="text-lg">รายการประเภทเอกสาร ({docTypes.length})</CardTitle>
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
                                    <TableHead>ชื่อประเภท</TableHead>
                                    <TableHead>การเคลื่อนไหว</TableHead>
                                    <TableHead>สถานะ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {docTypes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                                            ยังไม่มีข้อมูลประเภทเอกสาร
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    docTypes.map((dt) => (
                                        <TableRow key={dt.id}>
                                            <TableCell className="font-mono font-bold">{dt.docTypeCode}</TableCell>
                                            <TableCell>{dt.docTypeName}</TableCell>
                                            <TableCell>
                                                <Badge className={movementColors[dt.movementType] || ""}>
                                                    {dt.movementType}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={dt.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                                                    {dt.status}
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
