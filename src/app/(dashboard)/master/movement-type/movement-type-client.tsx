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
import { Plus, ArrowRightLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MovementType {
    id: number;
    movementTypeCode: string;
    movementTypeName: string;
    direction: string;
    status: string;
}

export function MovementTypeClient() {
    const [movementTypes, setMovementTypes] = useState<MovementType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newCode, setNewCode] = useState("");
    const [newName, setNewName] = useState("");
    const [direction, setDirection] = useState("IN");
    const [isSaving, setIsSaving] = useState(false);

    const fetchMovementTypes = async () => {
        try {
            const res = await fetch("/api/movement-types");
            const data = await res.json();
            setMovementTypes(data);
        } catch (error) {
            toast.error("ไม่สามารถโหลดข้อมูลได้");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMovementTypes();
    }, []);

    const handleCreate = async () => {
        if (!newCode || !newName) {
            toast.error("กรุณากรอกข้อมูลให้ครบ");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch("/api/movement-types", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    movementTypeCode: newCode,
                    movementTypeName: newName,
                    direction
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error);
            }

            toast.success("เพิ่มประเภทการเคลื่อนไหวเรียบร้อย");
            setNewCode("");
            setNewName("");
            setDirection("IN");
            setIsDialogOpen(false);
            fetchMovementTypes();
        } catch (error: any) {
            toast.error(error.message || "เกิดข้อผิดพลาด");
        } finally {
            setIsSaving(false);
        }
    };

    const directionColors: Record<string, string> = {
        IN: "bg-green-100 text-green-700",
        OUT: "bg-orange-100 text-orange-700",
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ArrowRightLeft className="w-7 h-7 text-purple-600" />
                        ประเภทการเคลื่อนไหว
                    </h1>
                    <p className="text-slate-500">จัดการประเภทการเคลื่อนไหวสต็อก</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-purple-600 hover:bg-purple-700">
                            <Plus className="w-4 h-4 mr-2" />
                            เพิ่มประเภท
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>เพิ่มประเภทการเคลื่อนไหวใหม่</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div>
                                <label className="text-sm font-medium">รหัสประเภท *</label>
                                <Input
                                    placeholder="เช่น GR, GI, ADJ-IN, ADJ-OUT"
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
                                <label className="text-sm font-medium">ทิศทางการเคลื่อนไหว *</label>
                                <select
                                    value={direction}
                                    onChange={(e) => setDirection(e.target.value)}
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                >
                                    <option value="IN">IN (เพิ่มสต็อก)</option>
                                    <option value="OUT">OUT (ลดสต็อก)</option>
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
                    <CardTitle className="text-lg">รายการประเภทการเคลื่อนไหว ({movementTypes.length})</CardTitle>
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
                                    <TableHead>ทิศทาง</TableHead>
                                    <TableHead>สถานะ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {movementTypes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                                            ยังไม่มีข้อมูลประเภทการเคลื่อนไหว
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    movementTypes.map((mt) => (
                                        <TableRow key={mt.id}>
                                            <TableCell className="font-mono font-bold">{mt.movementTypeCode}</TableCell>
                                            <TableCell>{mt.movementTypeName}</TableCell>
                                            <TableCell>
                                                <Badge className={directionColors[mt.direction] || ""}>
                                                    {mt.direction}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={mt.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                                                    {mt.status}
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
