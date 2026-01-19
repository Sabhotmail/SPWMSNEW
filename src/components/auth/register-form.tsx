"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const registerSchema = z
    .object({
        userId: z.string().min(1, "กรุณากรอกรหัสผู้ใช้"),
        username: z.string().min(1, "กรุณากรอกชื่อ"),
        email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง").optional().or(z.literal("")),
        password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
        confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่าน"),
        branchCode: z.string().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "รหัสผ่านไม่ตรงกัน",
        path: ["confirmPassword"],
    });

type RegisterFormData = z.infer<typeof registerSchema>;

interface Branch {
    branchCode: string;
    branchName: string;
}

export function RegisterForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [branches, setBranches] = useState<Branch[]>([]);

    const form = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            userId: "",
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
            branchCode: "",
        },
    });

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            const response = await fetch("/api/branches");
            if (response.ok) {
                const data = await response.json();
                setBranches(data);
            }
        } catch (error) {
            console.error("Error fetching branches:", error);
        }
    };

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || "เกิดข้อผิดพลาดในการลงทะเบียน");
                return;
            }

            toast.success("ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ");
            router.push("/login");
        } catch (error) {
            console.error("Error registering:", error);
            toast.error("เกิดข้อผิดพลาดในการลงทะเบียน");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>รหัสผู้ใช้ *</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="กรอกรหัสผู้ใช้"
                                    {...field}
                                    disabled={isLoading}
                                    onChange={(e) =>
                                        field.onChange(e.target.value.toUpperCase())
                                    }
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>ชื่อ-นามสกุล *</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="กรอกชื่อ-นามสกุล"
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
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>อีเมล</FormLabel>
                            <FormControl>
                                <Input
                                    type="email"
                                    placeholder="กรอกอีเมล (ไม่บังคับ)"
                                    {...field}
                                    disabled={isLoading}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {/* Branch field hidden - users don't need to select branch during registration */}
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>รหัสผ่าน *</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder="กรอกรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
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
                            <FormLabel>ยืนยันรหัสผ่าน *</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                                    {...field}
                                    disabled={isLoading}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            กำลังลงทะเบียน...
                        </>
                    ) : (
                        "ลงทะเบียน"
                    )}
                </Button>
            </form>
        </Form>
    );
}
