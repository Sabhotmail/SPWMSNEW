'use client';

import { useState, useEffect } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { AlertTriangle, ShieldCheck, Database, Loader2, Play, Timer, Terminal } from "lucide-react";

export default function MigrationClient() {
    const [migrationStatus, setMigrationStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [migrating, setMigrating] = useState(false);
    const [output, setOutput] = useState('');
    const [cleanMode, setCleanMode] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [stats, setStats] = useState<{ startTime: string, endTime: string, duration: string } | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    const [connection, setConnection] = useState({
        host: '192.168.53.10',
        port: '5432',
        database: 'siripro-stock',
        user: 'postgres',
        password: 'S1r1Pr0'
    });

    useEffect(() => {
        fetchMigrationStatus();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setConnection(prev => ({ ...prev, [name]: value }));
    };

    const fetchMigrationStatus = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/migrate');
            const data = await res.json();
            setMigrationStatus(data);
        } catch (error) {
            console.error('Failed to fetch migration status:', error);
        } finally {
            setLoading(false);
        }
    };

    const runMigration = async () => {
        if (!confirmPassword) {
            alert('กรุณาระบุรหัสผ่านเพื่อยืนยันการดำเนินการ');
            return;
        }
        setShowConfirm(true);
    };

    const handleConfirmMigration = async () => {
        setShowConfirm(false);
        const startTimestamp = new Date();
        setStats(null);
        setMigrating(true);
        setOutput(`[${startTimestamp.toLocaleTimeString()}] 🚀 เริ่มกระบวนการ Migration...\n\n`);

        try {
            const res = await fetch('/api/admin/migrate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'migrate',
                    clean: cleanMode,
                    connection,
                    confirmPassword
                }),
            });

            const data = await res.json();
            const endTimestamp = new Date();
            const durationMs = endTimestamp.getTime() - startTimestamp.getTime();
            const minutes = Math.floor(durationMs / 60000);
            const seconds = ((durationMs % 60000) / 1000).toFixed(0);

            const durationStr = `${minutes > 0 ? `${minutes} นาที ` : ''}${seconds} วินาที`;

            setStats({
                startTime: startTimestamp.toLocaleTimeString(),
                endTime: endTimestamp.toLocaleTimeString(),
                duration: durationStr
            });

            if (data.status === 'success') {
                setOutput(prev => prev + `[${endTimestamp.toLocaleTimeString()}] ✅ Migration สำเร็จ! (ใช้เวลา: ${durationStr})\n\n` + data.output);
                setConfirmPassword('');
                await fetchMigrationStatus();
            } else {
                setOutput(prev => prev + `[${endTimestamp.toLocaleTimeString()}] ❌ Migration ล้มเหลว!\n\n` + (data.error || data.errors || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'));
            }
        } catch (error: any) {
            setOutput(prev => prev + '\n❌ เกิดข้อผิดพลาด: ' + error.message);
        } finally {
            setMigrating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center group">
                    <div className="relative">
                        <Loader2 className="h-16 w-16 animate-spin text-blue-600 transition-all duration-500" />
                        <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-400 group-hover:scale-125 transition-transform" />
                    </div>
                    <p className="mt-6 text-slate-500 font-medium tracking-wide animate-pulse">กำลังตรวจสอบสถานะข้อมูล...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-10 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200">
                                <Database className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Data Migration</h1>
                        </div>
                        <p className="text-slate-500 ml-12">ถ่ายโอนข้อมูลจากระบบ Legacy เข้าสู่ระบบใหม่แบบ Real-time</p>
                    </div>

                    {stats && (
                        <div className="flex items-center gap-3 bg-white border border-blue-100 px-5 py-3 rounded-2xl shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="bg-blue-50 p-2 rounded-lg">
                                <Timer className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="text-sm">
                                <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Elapsed Time</div>
                                <div className="font-bold text-slate-900">{stats.duration} <span className="text-slate-400 font-normal ml-1">({stats.startTime} - {stats.endTime})</span></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Counter Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: 'Transactions', value: migrationStatus?.counts?.transactions, color: 'text-blue-600', icon: Play, bg: 'bg-blue-50' },
                        { label: 'Master Products', value: migrationStatus?.counts?.products, color: 'text-emerald-600', icon: ShieldCheck, bg: 'bg-emerald-50' },
                        { label: 'Live Stocks', value: migrationStatus?.counts?.stocks, color: 'text-violet-600', icon: Database, bg: 'bg-violet-50' }
                    ].map((card, i) => (
                        <div key={i} className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative overflow-hidden">
                            <div className={`absolute top-0 right-0 p-4 ${card.bg} rounded-bl-[24px] opacity-40 group-hover:scale-110 transition-transform`}>
                                <card.icon className={`h-10 w-10 ${card.color}`} />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-slate-500 font-semibold text-sm uppercase tracking-widest">{card.label}</h3>
                                <div className={`text-4xl font-black mt-3 ${card.color} tracking-tight`}>
                                    {card.value?.toLocaleString() || 0}
                                </div>
                                <div className="h-1 w-12 bg-slate-100 mt-4 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Configuration Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Connection Panel */}
                    <div className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                        <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                            Legacy Database Configuration
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            {[
                                { name: 'host', label: 'Host IP Address', type: 'text', placeholder: '192.168.x.x' },
                                { name: 'port', label: 'Port', type: 'text', placeholder: '5432' },
                                { name: 'database', label: 'Database Name', type: 'text' },
                                { name: 'user', label: 'Username', type: 'text' },
                                { name: 'password', label: 'System Password', type: 'password' }
                            ].map((field) => (
                                <div key={field.name} className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
                                    <input
                                        type={field.type}
                                        name={field.name}
                                        value={(connection as any)[field.name]}
                                        onChange={handleInputChange}
                                        placeholder={field.placeholder}
                                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Security & Action Panel */}
                    <div className="space-y-8">
                        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col h-full">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                <ShieldCheck className="h-5 w-5 text-blue-600" />
                                Authentication
                            </h2>

                            <div className="flex-1 space-y-6">
                                <div
                                    className={`relative p-6 rounded-[24px] border-2 transition-all duration-500 cursor-pointer overflow-hidden group ${cleanMode
                                        ? 'bg-red-50/50 border-red-200 shadow-lg shadow-red-100'
                                        : 'bg-white border-slate-100 hover:border-slate-200'
                                        }`}
                                    onClick={() => !migrating && setCleanMode(!cleanMode)}
                                >
                                    {/* Warning Pattern Background */}
                                    {cleanMode && (
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-100/30 rounded-full -mr-16 -mt-16 blur-3xl animate-pulse" />
                                    )}

                                    <div className="flex items-center justify-between relative z-10 w-full">
                                        <div className="space-y-1.5 pr-4 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`block font-black text-sm tracking-tight transition-colors duration-300 ${cleanMode ? 'text-red-700' : 'text-slate-800'}`}>
                                                    CLEAN STATE ACTIVE
                                                </span>
                                                {cleanMode && <AlertTriangle className="h-4 w-4 text-red-600 animate-bounce" />}
                                            </div>
                                            <span className={`text-[11px] leading-relaxed block transition-colors duration-300 ${cleanMode ? 'text-red-500' : 'text-slate-400'}`}>
                                                ล้างข้อมูลเดิมในระบบใหม่ทั้งหมดก่อนเริ่ม Import <br />
                                                <span className={`transition-all duration-300 ${cleanMode ? 'font-bold underline text-red-600' : 'opacity-0'}`}>
                                                    (ข้อมูลจะหายถาวร ไม่สามารถกู้คืนได้)
                                                </span>
                                            </span>
                                        </div>

                                        {/* Refined Premium Toggle */}
                                        <div className={`relative w-16 h-9 rounded-full transition-all duration-500 border-2 flex items-center px-1.5 ${cleanMode
                                                ? 'bg-red-600 border-red-600 shadow-[0_4px_20px_rgba(220,38,38,0.4)]'
                                                : 'bg-slate-200 border-slate-200'
                                            }`}>
                                            <div className={`bg-white w-6 h-6 rounded-full shadow-lg transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) transform ${cleanMode ? 'translate-x-7 scale-110' : 'translate-x-0'
                                                }`} />
                                        </div>
                                    </div>

                                    {/* Interactive Hover Border */}
                                    <div className={`absolute bottom-0 left-0 h-1 bg-red-500 transition-all duration-500 ${cleanMode ? 'w-full' : 'w-0'}`} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Admin Confirmation</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={migrating}
                                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-blue-500 transition-all"
                                        placeholder="Enter Login Password"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={runMigration}
                                disabled={migrating || !confirmPassword}
                                className={`
                                    w-full mt-8 px-6 py-5 rounded-2xl font-bold text-white shadow-xl shadow-blue-200 transition-all active:scale-95
                                    ${migrating || !confirmPassword
                                        ? 'bg-slate-200 shadow-none cursor-not-allowed text-slate-400'
                                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                                    }
                                `}
                            >
                                {migrating ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>SYSTEM MIGRATING...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-3 tracking-wider">
                                        <Play className="h-5 w-5 fill-current" />
                                        <span>EXECUTE MIGRATION</span>
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Console Output Section */}
                {output && (
                    <div className="bg-slate-900 rounded-[32px] p-8 shadow-2xl border border-slate-800 overflow-hidden relative group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-50" />

                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                <Terminal className="h-4 w-4" />
                                System Logs Output
                            </h2>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-red-500/50" />
                                <div className="h-2 w-2 rounded-full bg-yellow-500/50" />
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                            </div>
                        </div>

                        <div className="bg-black/40 rounded-2xl p-6 font-mono text-[11px] leading-relaxed max-h-[500px] overflow-auto border border-slate-800 scrollbar-hide">
                            <pre className="text-blue-400/90 whitespace-pre-wrap selection:bg-blue-500/30">
                                {output}
                            </pre>
                        </div>
                    </div>
                )}
            </div>

            {/* Custom Alert Dialog */}
            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent className="bg-white/80 backdrop-blur-xl border-none rounded-[40px] p-10 max-w-lg shadow-2xl">
                    <AlertDialogHeader>
                        <div className="mx-auto bg-red-50 h-20 w-20 rounded-full flex items-center justify-center mb-6">
                            <AlertTriangle className="h-10 w-10 text-red-500 animate-pulse" />
                        </div>
                        <AlertDialogTitle className="text-2xl font-black text-center text-slate-900 tracking-tight">
                            Confirm Critical Operation?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-slate-500 mt-4 leading-relaxed px-6">
                            คุณกำลังจะเริ่มกระบวนการถ่ายโอนข้อมูลขนาดใหญ่
                            {cleanMode && <strong className="text-red-600 block mt-2 text-lg">⚠️ โหมด LANN ข้อมูล (Clean Mode) ทำงานอยู่!</strong>}
                            การดำเนินการนี้จะใช้พลังประมวลผลสูงและอาจใช้เวลาหลายนาที
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-col gap-3 mt-10">
                        <AlertDialogAction
                            onClick={handleConfirmMigration}
                            className="w-full bg-slate-900 hover:bg-black text-white rounded-2xl py-6 font-bold text-lg shadow-xl shadow-slate-200 transition-all active:scale-95"
                        >
                            Confirm & Execute
                        </AlertDialogAction>
                        <AlertDialogCancel className="w-full border-none bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl py-6 font-bold transition-all">
                            Cancel
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
