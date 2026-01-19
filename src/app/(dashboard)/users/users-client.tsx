"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
    Plus,
    Search,
    Users,
    Shield,
    User,
    Loader2,
    Pencil,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface UserData {
    id: number;
    userId: string;
    username: string;
    email: string | null;
    role: number;
    branchCode: string | null;
    status: string;
    createdAt: Date;
}

interface Branch {
    branchCode: string;
    branchName: string;
}

interface UsersClientProps {
    initialUsers: UserData[];
    branches: Branch[];
}

const roleNames: Record<number, { name: string; color: string }> = {
    1: { name: "User", color: "bg-slate-100 text-slate-700" },
    3: { name: "Staff", color: "bg-sky-100 text-sky-700" },
    5: { name: "Supervisor", color: "bg-blue-100 text-blue-700" },
    7: { name: "Manager", color: "bg-purple-100 text-purple-700" },
    9: { name: "Admin", color: "bg-red-100 text-red-700" },
};

export function UsersClient({ initialUsers, branches }: UsersClientProps) {
    const [users, setUsers] = useState<UserData[]>(initialUsers);
    const [search, setSearch] = useState("");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);

    // Separate form states for create and edit
    const [createForm, setCreateForm] = useState({
        userId: "",
        username: "",
        password: "",
        email: "",
        role: "1",
        branchCode: branches.length > 0 ? branches[0].branchCode : "",
    });

    const [editForm, setEditForm] = useState({
        userId: "",
        username: "",
        password: "",
        email: "",
        role: "1",
        branchCode: "",
        status: "ACTIVE",
    });

    const filteredUsers = users.filter(
        (u) =>
            u.userId.toLowerCase().includes(search.toLowerCase()) ||
            u.username.toLowerCase().includes(search.toLowerCase())
    );

    const resetCreateForm = () => {
        setCreateForm({
            userId: "",
            username: "",
            password: "",
            email: "",
            role: "1",
            branchCode: branches.length > 0 ? branches[0].branchCode : "",
        });
    };

    const openEditDialog = (user: UserData) => {
        setEditingUser(user);
        setEditForm({
            userId: user.userId,
            username: user.username,
            password: "",
            email: user.email || "",
            role: String(user.role),
            branchCode: user.branchCode || "",
            status: user.status,
        });
        setIsEditDialogOpen(true);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(createForm),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to create user");
            }

            const created = await res.json();
            setUsers([{ ...created, createdAt: new Date() }, ...users]);
            toast.success("เพิ่มผู้ใช้สำเร็จ");
            setIsCreateDialogOpen(false);
            resetCreateForm();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setIsLoading(true);

        try {
            const res = await fetch(`/api/users/${editingUser.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to update user");
            }

            const updated = await res.json();
            setUsers(users.map(u => u.id === updated.id ? { ...updated, createdAt: u.createdAt } : u));
            toast.success("แก้ไขผู้ใช้สำเร็จ");
            setIsEditDialogOpen(false);
            setEditingUser(null);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (userId: number) => {
        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to delete user");
            }

            setUsers(users.filter(u => u.id !== userId));
            toast.success("ลบผู้ใช้สำเร็จ");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl text-white shadow-lg">
                            <Users className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900">จัดการผู้ใช้งาน</h1>
                            <p className="text-slate-500">ผู้ใช้งานทั้งหมด {users.length} คน</p>
                        </div>
                    </div>

                    {/* Create Dialog */}
                    <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                        setIsCreateDialogOpen(open);
                        if (!open) resetCreateForm();
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg rounded-xl">
                                <Plus className="w-4 h-4 mr-2" />
                                เพิ่มผู้ใช้
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Plus className="w-5 h-5 text-blue-600" />
                                    เพิ่มผู้ใช้ใหม่
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4">
                                {/* Create Form Fields - Inline */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>รหัสผู้ใช้ *</Label>
                                        <Input
                                            value={createForm.userId}
                                            onChange={(e) => setCreateForm(prev => ({ ...prev, userId: e.target.value.toUpperCase() }))}
                                            placeholder="USER01"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>รหัสผ่าน *</Label>
                                        <Input
                                            type="password"
                                            value={createForm.password}
                                            onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                                            placeholder="รหัสผ่าน"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>ชื่อ-นามสกุล *</Label>
                                    <Input
                                        value={createForm.username}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, username: e.target.value }))}
                                        placeholder="ชื่อ-นามสกุล"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>อีเมล</Label>
                                    <Input
                                        type="email"
                                        value={createForm.email}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="email@example.com"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>บทบาท *</Label>
                                        <select
                                            value={createForm.role}
                                            onChange={(e) => setCreateForm(prev => ({ ...prev, role: e.target.value }))}
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                            required
                                        >
                                            <option value="1">User</option>
                                            <option value="3">Staff</option>
                                            <option value="5">Supervisor</option>
                                            <option value="7">Manager</option>
                                            <option value="9">Admin</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>สาขา *</Label>
                                        <select
                                            value={createForm.branchCode}
                                            onChange={(e) => setCreateForm(prev => ({ ...prev, branchCode: e.target.value }))}
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                            required
                                        >
                                            {branches.map((b) => (
                                                <option key={b.branchCode} value={b.branchCode}>
                                                    {b.branchName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline">ยกเลิก</Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        เพิ่มผู้ใช้
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Search */}
                <Card className="border-0 shadow-lg rounded-2xl">
                    <CardContent className="p-4">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="ค้นหารหัสผู้ใช้หรือชื่อ..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 rounded-xl border-slate-200"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card className="border-0 shadow-xl rounded-3xl overflow-hidden">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gradient-to-r from-slate-100 to-slate-50 hover:from-slate-100 hover:to-slate-50">
                                    <TableHead className="font-bold text-slate-600 py-4">รหัสผู้ใช้</TableHead>
                                    <TableHead className="font-bold text-slate-600">ชื่อ-นามสกุล</TableHead>
                                    <TableHead className="font-bold text-slate-600">อีเมล</TableHead>
                                    <TableHead className="font-bold text-slate-600">บทบาท</TableHead>
                                    <TableHead className="font-bold text-slate-600">สาขา</TableHead>
                                    <TableHead className="font-bold text-slate-600">สถานะ</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-center">การจัดการ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-3">
                                                <Users className="w-12 h-12 text-slate-200" />
                                                <p className="text-slate-400">ไม่พบข้อมูลผู้ใช้</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.id} className="hover:bg-blue-50/50 transition-colors">
                                            <TableCell className="font-bold">
                                                <div className="flex items-center gap-2">
                                                    {user.role >= 7 ? (
                                                        <div className="p-1.5 bg-purple-100 rounded-lg">
                                                            <Shield className="w-4 h-4 text-purple-600" />
                                                        </div>
                                                    ) : (
                                                        <div className="p-1.5 bg-slate-100 rounded-lg">
                                                            <User className="w-4 h-4 text-slate-500" />
                                                        </div>
                                                    )}
                                                    <span className="text-slate-900">{user.userId}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-700">{user.username}</TableCell>
                                            <TableCell className="text-slate-500">{user.email || "-"}</TableCell>
                                            <TableCell>
                                                <Badge className={`${roleNames[user.role]?.color || "bg-slate-100"} font-medium`}>
                                                    {roleNames[user.role]?.name || `Role ${user.role}`}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-600">{user.branchCode || "-"}</TableCell>
                                            <TableCell>
                                                <Badge className={user.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                                                    {user.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-2">
                                                    {/* Edit Button */}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openEditDialog(user)}
                                                        className="border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </Button>

                                                    {/* Delete Button */}
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="border-red-200 text-red-600 hover:bg-red-50 rounded-lg"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>ยืนยันการลบผู้ใช้</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    คุณต้องการลบผู้ใช้ <span className="font-bold text-slate-900">{user.username}</span> ({user.userId}) หรือไม่?
                                                                    การดำเนินการนี้ไม่สามารถย้อนกลับได้
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDelete(user.id)}
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                >
                                                                    ลบผู้ใช้
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Edit Dialog - Separate from main render to prevent re-creation */}
                <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                    setIsEditDialogOpen(open);
                    if (!open) setEditingUser(null);
                }}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Pencil className="w-5 h-5 text-blue-600" />
                                แก้ไขผู้ใช้: {editingUser?.userId}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            {/* Edit Form Fields - Inline with separate state */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>รหัสผู้ใช้ *</Label>
                                    <Input
                                        value={editForm.userId}
                                        disabled
                                        className="bg-slate-100"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)</Label>
                                    <Input
                                        type="password"
                                        value={editForm.password}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                                        placeholder="รหัสผ่านใหม่"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>ชื่อ-นามสกุล *</Label>
                                <Input
                                    value={editForm.username}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                                    placeholder="ชื่อ-นามสกุล"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>อีเมล</Label>
                                <Input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="email@example.com"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>บทบาท *</Label>
                                    <select
                                        value={editForm.role}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                        required
                                    >
                                        <option value="1">User</option>
                                        <option value="3">Staff</option>
                                        <option value="5">Supervisor</option>
                                        <option value="7">Manager</option>
                                        <option value="9">Admin</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>สาขา *</Label>
                                    <select
                                        value={editForm.branchCode}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, branchCode: e.target.value }))}
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                        required
                                    >
                                        {branches.map((b) => (
                                            <option key={b.branchCode} value={b.branchCode}>
                                                {b.branchName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>สถานะ</Label>
                                <select
                                    value={editForm.status}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                >
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="INACTIVE">INACTIVE</option>
                                </select>
                            </div>

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">ยกเลิก</Button>
                                </DialogClose>
                                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    บันทึก
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
