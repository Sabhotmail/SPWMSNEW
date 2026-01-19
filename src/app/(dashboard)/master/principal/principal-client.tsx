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
import { Plus, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Principal {
    id: number;
    principalCode: string;
    principalName: string;
    status: string;
}

export function PrincipalClient() {
    const [principals, setPrincipals] = useState<Principal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newCode, setNewCode] = useState("");
    const [newName, setNewName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const fetchPrincipals = async () => {
        try {
            const res = await fetch("/api/principals");
            const data = await res.json();
            setPrincipals(data);
        } catch (error) {
            toast.error("ไม่สามารถโหลดข้อมูลได้");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPrincipals();
    }, []);

    const handleCreate = async () => {
        if (!newCode || !newName) {
            toast.error("กรุณากรอกข้อมูลให้ครบ");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch("/api/principals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ principalCode: newCode, principalName: newName }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error);
            }

            toast.success("เพิ่มผู้ผลิตเรียบร้อย");
            setNewCode("");
            setNewName("");
            setIsDialogOpen(false);
            fetchPrincipals();
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
                        <Building2 className="w-7 h-7 text-indigo-600" />
                        ผู้ผลิต / ซัพพลายเออร์
                    </h1>
                    <p className="text-slate-500">จัดการข้อมูลผู้ผลิตและซัพพลายเออร์</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="w-4 h-4 mr-2" />
                            เพิ่มผู้ผลิต
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>เพิ่มผู้ผลิตใหม่</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div>
                                <label className="text-sm font-medium">รหัสผู้ผลิต *</label>
                                <Input
                                    placeholder="เช่น SUP001"
                                    value={newCode}
                                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">ชื่อผู้ผลิต *</label>
                                <Input
                                    placeholder="เช่น บริษัท ABC จำกัด"
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
                    <CardTitle className="text-lg">รายการผู้ผลิต ({principals.length})</CardTitle>
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
                                    <TableHead>ชื่อผู้ผลิต</TableHead>
                                    <TableHead>สถานะ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {principals.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                                            ยังไม่มีข้อมูลผู้ผลิต
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    principals.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-mono font-bold">{p.principalCode}</TableCell>
                                            <TableCell>{p.principalName}</TableCell>
                                            <TableCell>
                                                <Badge className={p.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                                                    {p.status}
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
