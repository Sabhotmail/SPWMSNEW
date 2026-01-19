"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Loader2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                userId,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("รหัสผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch {
            setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
            </div>

            <Card className="w-full max-w-md mx-4 relative bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Package className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold text-white">SP WMS</CardTitle>
                        <CardDescription className="text-slate-300">
                            ระบบจัดการคลังสินค้า
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="userId" className="text-slate-200">
                                รหัสผู้ใช้
                            </Label>
                            <Input
                                id="userId"
                                type="text"
                                placeholder="กรอกรหัสผู้ใช้"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-slate-200">
                                    รหัสผ่าน
                                </Label>
                                <a
                                    href="/forgot-password"
                                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    ลืมรหัสผ่าน?
                                </a>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="กรอกรหัสผ่าน"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5 transition-all duration-200 shadow-lg hover:shadow-xl"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    กำลังเข้าสู่ระบบ...
                                </>
                            ) : (
                                "เข้าสู่ระบบ"
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <span className="text-slate-400 text-sm">ยังไม่มีบัญชี? </span>
                        <a
                            href="/register"
                            className="text-blue-400 hover:text-blue-300 font-medium text-sm"
                        >
                            ลงทะเบียน
                        </a>
                    </div>

                    <div className="mt-4 text-center text-xs text-slate-400">
                        SP WMS v2.0.0
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
