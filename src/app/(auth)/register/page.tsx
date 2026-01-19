import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/components/auth/register-form";
import Link from "next/link";
import { Package } from "lucide-react";

export default function RegisterPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1">
                    <div className="flex items-center justify-center mb-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                            <Package className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl text-center">ลงทะเบียน</CardTitle>
                    <CardDescription className="text-center">
                        สร้างบัญชีใหม่สำหรับเข้าใช้งานระบบ SPWMS
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RegisterForm />
                    <div className="mt-6 text-center text-sm">
                        <span className="text-slate-500">มีบัญชีอยู่แล้ว? </span>
                        <Link
                            href="/login"
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            เข้าสู่ระบบ
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
