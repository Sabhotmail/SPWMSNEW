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
import { Key, Loader2 } from "lucide-react";

const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, "กรุณากรอกรหัสผ่านปัจจุบัน"),
        newPassword: z.string().min(6, "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร"),
        confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่านใหม่"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "รหัสผ่านใหม่ไม่ตรงกัน",
        path: ["confirmPassword"],
    });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export function ChangePasswordDialog() {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<ChangePasswordFormData>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (data: ChangePasswordFormData) => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/users/change-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
                return;
            }

            toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
            form.reset();
            setOpen(false);
        } catch (error) {
            console.error("Error changing password:", error);
            toast.error("เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                    <Key className="w-4 h-4 mr-2" />
                    เปลี่ยนรหัสผ่าน
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>เปลี่ยนรหัสผ่าน</DialogTitle>
                    <DialogDescription>
                        กรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่ของคุณ
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="currentPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>รหัสผ่านปัจจุบัน</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="กรอกรหัสผ่านปัจจุบัน"
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
                                        กำลังเปลี่ยน...
                                    </>
                                ) : (
                                    "เปลี่ยนรหัสผ่าน"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
