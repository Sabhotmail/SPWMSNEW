"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "success" | "warning" | "danger";
    onConfirm: () => void;
    onCancel?: () => void;
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText = "ยืนยัน",
    cancelText = "ยกเลิก",
    variant = "default",
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const icons = {
        default: <Info className="w-12 h-12 text-blue-500" />,
        success: <CheckCircle className="w-12 h-12 text-green-500" />,
        warning: <AlertTriangle className="w-12 h-12 text-yellow-500" />,
        danger: <XCircle className="w-12 h-12 text-red-500" />,
    };

    const buttonStyles = {
        default: "bg-blue-600 hover:bg-blue-700 text-white",
        success: "bg-green-600 hover:bg-green-700 text-white",
        warning: "bg-yellow-600 hover:bg-yellow-700 text-white",
        danger: "bg-red-600 hover:bg-red-700 text-white",
    };

    const handleCancel = () => {
        onOpenChange(false);
        onCancel?.();
    };

    const handleConfirm = () => {
        onOpenChange(false);
        onConfirm();
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader className="flex flex-col items-center text-center">
                    <div className="mb-4 p-4 rounded-full bg-slate-100">
                        {icons[variant]}
                    </div>
                    <AlertDialogTitle className="text-xl font-bold">
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-base text-slate-600 mt-2">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex gap-3 mt-6 sm:justify-center">
                    <AlertDialogCancel
                        onClick={handleCancel}
                        className="flex-1 sm:flex-none"
                    >
                        {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        className={`flex-1 sm:flex-none ${buttonStyles[variant]}`}
                    >
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
