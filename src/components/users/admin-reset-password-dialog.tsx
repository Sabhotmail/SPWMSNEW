"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";

const resetPasswordSchema = z.object({
    newPassword: z.string().min(6, "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร"),
    confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่านใหม่"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "รหัสผ่านใหม่ไม่ตรงกัน",
    path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface AdminResetPasswordDialogProps {
    userId: number;
    username: string;
    onSuccess?: () => void;
}

export function AdminResetPasswordDialog({
    userId,
    username,
    onSuccess,
}: AdminResetPasswordDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            newPassword: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (data: ResetPasswordFormData) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/users/${userId}/reset-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ newPassword: data.newPassword }),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน");
                return;
            }

            toast.success(`รีเซ็ตรหัสผ่านสำหรับ ${username} สำเร็จ`);
            form.reset();
            setOpen(false);
            onSuccess?.();
        } catch (error) {
            console.error("Error resetting password:", error);
            toast.error("เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <KeyRound className="w-4 h-4 mr-2" />
                    รีเซ็ตรหัสผ่าน
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>รีเซ็ตรหัสผ่าน</DialogTitle>
                    <DialogDescription>
                        รีเซ็ตรหัสผ่านสำหรับผู้ใช้: <span className="font-semibold text-slate-900">{username}</span>
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                            <p className="font-medium mb-1">⚠️ คำเตือน:</p>
                            <p className="text-xs">
                                การรีเซ็ตรหัสผ่านจะเปลี่ยนรหัสผ่านของผู้ใช้ทันที
                                กรุณาแจ้งรหัสผ่านใหม่ให้ผู้ใช้ทราบ
                            </p>
                        </div>

                        <FormField
                            control={form.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>รหัสผ่านใหม่</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ยืนยันรหัสผ่านใหม่</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => setOpen(false)}
                                disabled={isLoading}
                            >
                                ยกเลิก
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        กำลังรีเซ็ต...
                                    </>
                                ) : (
                                    "รีเซ็ตรหัสผ่าน"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
