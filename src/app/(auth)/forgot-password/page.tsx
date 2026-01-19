"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Package, Loader2, KeyRound, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const resetPasswordSchema = z
    .object({
        userId: z.string().min(1, "กรุณากรอกรหัสผู้ใช้"),
        email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง").optional().or(z.literal("")),
        newPassword: z.string().min(6, "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร"),
        confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่านใหม่"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "รหัสผ่านใหม่ไม่ตรงกัน",
        path: ["confirmPassword"],
    });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            userId: "",
            email: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (data: ResetPasswordFormData) => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน");
                return;
            }

            toast.success("รีเซ็ตรหัสผ่านสำเร็จ! กรุณาเข้าสู่ระบบ");
            router.push("/login");
        } catch (error) {
            console.error("Error resetting password:", error);
            toast.error("เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
            </div>

            <Card className="w-full max-w-md relative bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <KeyRound className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold text-white">ลืมรหัสผ่าน</CardTitle>
                        <CardDescription className="text-slate-300">
                            รีเซ็ตรหัสผ่านของคุณ
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="userId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-200">รหัสผู้ใช้ *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="กรอกรหัสผู้ใช้ของคุณ"
                                                {...field}
                                                disabled={isLoading}
                                                onChange={(e) =>
                                                    field.onChange(e.target.value.toUpperCase())
                                                }
                                                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-300" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-200">
                                            อีเมล (สำหรับยืนยันตัวตน)
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="กรอกอีเมลที่ลงทะเบียนไว้"
                                                {...field}
                                                disabled={isLoading}
                                                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-300" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-200">รหัสผ่านใหม่ *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                                                {...field}
                                                disabled={isLoading}
                                                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-300" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-200">
                                            ยืนยันรหัสผ่านใหม่ *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                                                {...field}
                                                disabled={isLoading}
                                                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-300" />
                                    </FormItem>
                                )}
                            />

                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs text-slate-300">
                                <p className="font-medium text-blue-300 mb-1">
                                    หมายเหตุ:
                                </p>
                                <p>
                                    กรุณากรอกรหัสผู้ใช้และอีเมลที่ลงทะเบียนไว้
                                    เพื่อยืนยันตัวตนก่อนรีเซ็ตรหัสผ่าน
                                </p>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        กำลังรีเซ็ตรหัสผ่าน...
                                    </>
                                ) : (
                                    <>
                                        <KeyRound className="w-4 h-4 mr-2" />
                                        รีเซ็ตรหัสผ่าน
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>

                    <div className="mt-6 text-center">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            กลับไปหน้าเข้าสู่ระบบ
                        </Link>
                    </div>

                    <div className="mt-4 text-center text-xs text-slate-400">
                        SP WMS v2.0.0
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
