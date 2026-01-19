import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Building2, Shield, Calendar, AlertTriangle } from "lucide-react";
import { ChangePasswordDialog } from "@/components/profile/change-password-form";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const user = session.user;

    // Get full user data including passwordDate
    const userData = await prisma.user.findUnique({
        where: { userId: user.userId },
        select: {
            passwordDate: true,
        },
    });

    // Calculate days since password change (90 days = expiry)
    const PASSWORD_EXPIRY_DAYS = 90;
    const passwordDate = userData?.passwordDate;
    let daysSinceChange = null;
    let daysUntilExpiry = null;
    let isExpiringSoon = false;
    let isExpired = false;

    if (passwordDate) {
        const now = new Date();
        const diffTime = now.getTime() - passwordDate.getTime();
        daysSinceChange = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        daysUntilExpiry = PASSWORD_EXPIRY_DAYS - daysSinceChange;
        isExpiringSoon = daysUntilExpiry <= 14 && daysUntilExpiry > 0;
        isExpired = daysUntilExpiry <= 0;
    }

    const getRoleName = (role: number) => {
        if (role >= 9) return "Super Admin";
        if (role >= 7) return "Admin";
        if (role >= 5) return "Manager";
        return "User";
    };

    const getRoleColor = (role: number) => {
        if (role >= 9) return "bg-purple-100 text-purple-800 border-purple-200";
        if (role >= 7) return "bg-red-100 text-red-800 border-red-200";
        if (role >= 5) return "bg-blue-100 text-blue-800 border-blue-200";
        return "bg-gray-100 text-gray-800 border-gray-200";
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    โปรไฟล์ของฉัน
                </h1>
                <p className="text-slate-500">จัดการข้อมูลส่วนตัวและการตั้งค่า</p>
            </div>

            {/* Profile Card */}
            <Card>
                <CardHeader>
                    <CardTitle>ข้อมูลผู้ใช้</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Avatar and Name Section */}
                    <div className="flex items-center gap-6">
                        <Avatar className="w-24 h-24">
                            <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                {user.name?.charAt(0).toUpperCase() ||
                                    user.userId?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {user.name}
                            </h2>
                            <p className="text-slate-500 mt-1">@{user.userId}</p>
                            <Badge
                                variant="outline"
                                className={`mt-2 ${getRoleColor(user.role)}`}
                            >
                                <Shield className="w-3 h-3 mr-1" />
                                {getRoleName(user.role)}
                            </Badge>
                        </div>
                    </div>

                    <Separator />

                    {/* User Details */}
                    <div className="grid gap-4">
                        <div className="flex items-start gap-3">
                            <User className="w-5 h-5 text-slate-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-slate-500">ชื่อผู้ใช้</p>
                                <p className="text-base font-medium text-slate-900 dark:text-white">
                                    {user.userId}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-slate-500">อีเมล</p>
                                <p className="text-base font-medium text-slate-900 dark:text-white">
                                    {user.email || "ไม่ระบุ"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Building2 className="w-5 h-5 text-slate-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-slate-500">สาขา</p>
                                <p className="text-base font-medium text-slate-900 dark:text-white">
                                    {user.branchCode}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Shield className="w-5 h-5 text-slate-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-slate-500">ระดับสิทธิ์</p>
                                <p className="text-base font-medium text-slate-900 dark:text-white">
                                    {getRoleName(user.role)} (Level {user.role})
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Security Card */}
            <Card>
                <CardHeader>
                    <CardTitle>ความปลอดภัย</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Password Expiry Warning */}
                    {isExpired && (
                        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-red-900 mb-1">
                                        รหัสผ่านของคุณหมดอายุแล้ว!
                                    </h4>
                                    <p className="text-sm text-red-700">
                                        รหัสผ่านของคุณหมดอายุเมื่อ {Math.abs(daysUntilExpiry!)} วันที่แล้ว
                                        กรุณาเปลี่ยนรหัสผ่านใหม่เพื่อความปลอดภัย
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {isExpiringSoon && !isExpired && (
                        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-yellow-900 mb-1">
                                        รหัสผ่านของคุณกำลังจะหมดอายุ
                                    </h4>
                                    <p className="text-sm text-yellow-700">
                                        รหัสผ่านของคุณจะหมดอายุในอีก {daysUntilExpiry} วัน
                                        แนะนำให้เปลี่ยนรหัสผ่านใหม่เพื่อความปลอดภัย
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <p className="text-sm text-slate-500 mb-2">
                            จัดการรหัสผ่านและการตั้งค่าความปลอดภัยของบัญชีของคุณ
                        </p>

                        {passwordDate && (
                            <div className="flex items-center gap-2 text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg">
                                <Calendar className="w-4 h-4" />
                                <span>
                                    เปลี่ยนรหัสผ่านล่าสุด: {new Date(passwordDate).toLocaleDateString("th-TH")}
                                    {daysSinceChange !== null && ` (${daysSinceChange} วันที่แล้ว)`}
                                </span>
                            </div>
                        )}

                        {!passwordDate && (
                            <div className="flex items-center gap-2 text-sm text-orange-600 mb-4 bg-orange-50 p-3 rounded-lg border border-orange-200">
                                <AlertTriangle className="w-4 h-4" />
                                <span>
                                    ยังไม่เคยเปลี่ยนรหัสผ่าน - แนะนำให้เปลี่ยนเพื่อความปลอดภัย
                                </span>
                            </div>
                        )}

                        <ChangePasswordDialog />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
