"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Calendar, Loader2, AlertTriangle } from "lucide-react";

interface ProductUOM {
    uomCode: string;
    uomRatio: number;
}

interface Product {
    productCode: string;
    productName: string;
    shelfLife: number; // in months
    maxMfgDays?: number; // max days since manufacturing
    stockControl?: string; // FEFO, FIFO, LIFO
    productUOMs?: ProductUOM[];
}

interface StockDateOption {
    id: number;
    mfgDate: string;
    expDate: string;
    qty: number;
    locCode: string;
}

interface AddProductDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (items: AddItemData[]) => Promise<void>;
    product: Product | null;
    isInbound?: boolean; // Show MFG/EXP only for Inbound/Adjustment documents
    whCode?: string; // Warehouse code for fetching stock dates
}

export interface AddItemData {
    productCode: string;
    qty: number;
    uomCode: string;
    uomRatio: number;
    pieceQty: number;
    mfgDate?: string;
    expDate?: string;
    remark?: string; // For UOM breakdown display
}

export function AddProductDialog({
    isOpen,
    onClose,
    onConfirm,
    product,
    isInbound = false,
    whCode,
}: AddProductDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [availableUOMs, setAvailableUOMs] = useState<ProductUOM[]>([]);
    const [stockDates, setStockDates] = useState<StockDateOption[]>([]);
    const [selectedStockDate, setSelectedStockDate] = useState<StockDateOption | null>(null);

    // Multi-UOM quantities
    const [qtyCTN, setQtyCTN] = useState(0);
    const [qtyPAC, setQtyPAC] = useState(0);
    const [qtyPCS, setQtyPCS] = useState(0);

    // Date fields
    const [mfgDate, setMfgDate] = useState("");
    const [expDate, setExpDate] = useState("");
    const [mfgWarning, setMfgWarning] = useState<string | null>(null);

    // Calculate MFG warning
    const checkMfgWarning = (date: string) => {
        if (!date || !product?.maxMfgDays || product.maxMfgDays <= 0) {
            setMfgWarning(null);
            return;
        }
        const mfg = new Date(date);
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - mfg.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > product.maxMfgDays) {
            setMfgWarning(`⚠️ วันที่ผลิตเกินกำหนด (ผลิตมาแล้ว ${diffDays} วัน, กำหนด ${product.maxMfgDays} วัน)`);
        } else {
            setMfgWarning(null);
        }
    };

    // Fetch UOMs when product changes
    useEffect(() => {
        if (product && isOpen) {
            fetchUOMs(product.productCode);
            // Reset form
            setQtyCTN(0);
            setQtyPAC(0);
            setQtyPCS(0);
            setMfgDate("");
            setExpDate("");
            setMfgWarning(null);
            setSelectedStockDate(null);

            // Fetch stock dates for Outbound only
            if (!isInbound && whCode) {
                fetchStockDates(product.productCode, whCode);
            } else {
                setStockDates([]);
            }
        }
    }, [product, isOpen, isInbound, whCode]);

    const fetchStockDates = async (productCode: string, wh: string) => {
        try {
            const res = await fetch(`/api/products/${productCode}/stock-dates?whCode=${wh}`);
            const data = await res.json();
            setStockDates(data.stockDates || []);
        } catch (error) {
            console.error("Failed to fetch stock dates:", error);
        }
    };


    const fetchUOMs = async (productCode: string) => {
        try {
            const res = await fetch(`/api/products/${productCode}/uoms`);
            const data = await res.json();
            setAvailableUOMs(data.uoms || []);
        } catch (error) {
            console.error("Failed to fetch UOMs:", error);
        }
    };

    const getUOMRatio = (uomCode: string): number => {
        const uom = availableUOMs.find(u => u.uomCode === uomCode);
        return uom?.uomRatio || 1;
    };

    const hasUOM = (uomCode: string): boolean => {
        return availableUOMs.some(u => u.uomCode === uomCode);
    };

    const handleConfirm = async () => {
        if (!product) return;

        const items: AddItemData[] = [];

        // Initial logic to calculate EXP from MFG + shelfLife moved to a dedicated function or onChange
        // We use the state value instead
        const calculatedExpDate = expDate;

        // Calculate total pieces from all UOMs
        const totalPieceQty =
            (qtyCTN * getUOMRatio("CTN")) +
            (qtyPAC * getUOMRatio("PAC")) +
            (qtyPCS * getUOMRatio("PCS"));

        if (totalPieceQty <= 0) {
            return; // No items to add
        }

        // Create breakdown string for display (e.g., "1 ลัง + 2 แพ็ค + 5 ชิ้น")
        const breakdownParts: string[] = [];
        if (qtyCTN > 0) breakdownParts.push(`${qtyCTN} ลัง`);
        if (qtyPAC > 0) breakdownParts.push(`${qtyPAC} แพ็ค`);
        if (qtyPCS > 0) breakdownParts.push(`${qtyPCS} ชิ้น`);
        const remarkText = breakdownParts.join(' + ');

        // Create a single consolidated item with total piece quantity
        // For Outbound: use selected stock date's MFG/EXP
        // For Inbound: use entered MFG and EXP (which was auto-calc'd but could be overridden)
        const itemMfgDate = isInbound ? mfgDate : (selectedStockDate ? selectedStockDate.mfgDate : undefined);
        const itemExpDate = isInbound ? expDate : (selectedStockDate ? selectedStockDate.expDate : undefined);

        items.push({
            productCode: product.productCode,
            qty: totalPieceQty,
            uomCode: "PCS",
            uomRatio: 1,
            pieceQty: totalPieceQty,
            mfgDate: itemMfgDate,
            expDate: itemExpDate,
            remark: remarkText,  // Store the breakdown
        });

        setIsLoading(true);
        try {
            await onConfirm(items);
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const totalPieces =
        (qtyCTN * getUOMRatio("CTN")) +
        (qtyPAC * getUOMRatio("PAC")) +
        (qtyPCS * getUOMRatio("PCS"));

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        เพิ่มสินค้า
                    </DialogTitle>
                </DialogHeader>

                {product && (
                    <div className="space-y-4">
                        {/* Product Info */}
                        <div className="bg-slate-50 rounded-lg p-3">
                            <p className="font-bold text-blue-700">{product.productCode}</p>
                            <p className="text-sm text-slate-600 line-clamp-2">{product.productName}</p>
                            {product.shelfLife > 0 && (
                                <p className="text-xs text-slate-400 mt-1">อายุสินค้า: {product.shelfLife} เดือน</p>
                            )}
                        </div>

                        {/* Multi-UOM Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">จำนวน</label>
                            <div className="grid grid-cols-3 gap-3">
                                {hasUOM("CTN") && (
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500">ลัง (CTN)</label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={qtyCTN}
                                            onChange={(e) => setQtyCTN(Number(e.target.value) || 0)}
                                            className="text-center font-bold"
                                        />
                                        <p className="text-[10px] text-slate-400 text-center">
                                            = {qtyCTN * getUOMRatio("CTN")} ชิ้น
                                        </p>
                                    </div>
                                )}
                                {hasUOM("PAC") && (
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500">แพ็ค (PAC)</label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={qtyPAC}
                                            onChange={(e) => setQtyPAC(Number(e.target.value) || 0)}
                                            className="text-center font-bold"
                                        />
                                        <p className="text-[10px] text-slate-400 text-center">
                                            = {qtyPAC * getUOMRatio("PAC")} ชิ้น
                                        </p>
                                    </div>
                                )}
                                {hasUOM("PCS") && (
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500">ชิ้น (PCS)</label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={qtyPCS}
                                            onChange={(e) => setQtyPCS(Number(e.target.value) || 0)}
                                            className="text-center font-bold"
                                        />
                                    </div>
                                )}
                            </div>
                            {totalPieces > 0 && (
                                <p className="text-sm text-blue-600 font-semibold text-center mt-2">
                                    รวม: {totalPieces.toLocaleString()} ชิ้น
                                </p>
                            )}
                        </div>

                        {/* Stock Date Selection for Outbound */}
                        {!isInbound && stockDates.length > 0 && (
                            <div className="space-y-2 pt-2 border-t">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    เลือกวันผลิต (Lot)
                                </label>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {stockDates.map((sd) => (
                                        <div
                                            key={sd.id}
                                            onClick={() => setSelectedStockDate(sd)}
                                            className={`p-2 rounded-md cursor-pointer border text-xs flex justify-between items-center ${selectedStockDate?.id === sd.id
                                                ? "bg-blue-50 border-blue-400"
                                                : "bg-white border-slate-200 hover:bg-slate-50"
                                                }`}
                                        >
                                            <div>
                                                <span className="font-semibold">MFG:</span> {new Date(sd.mfgDate).toLocaleDateString("th-TH")}
                                                <span className="mx-2">|</span>
                                                <span className="font-semibold">EXP:</span> {new Date(sd.expDate).toLocaleDateString("th-TH")}
                                            </div>
                                            <div className="text-blue-600 font-bold">
                                                {Number(sd.qty).toLocaleString()} ชิ้น
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {selectedStockDate && (
                                    <p className="text-xs text-green-600">
                                        ✓ เลือกแล้ว: MFG {new Date(selectedStockDate.mfgDate).toLocaleDateString("th-TH")}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* No stock warning for Outbound */}
                        {!isInbound && stockDates.length === 0 && whCode && (
                            <div className="p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-xs">
                                ⚠️ ไม่พบสต๊อกสินค้านี้ในคลัง
                            </div>
                        )}

                        {isInbound && (
                            <div className="space-y-4 pt-2 border-t">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-blue-500" />
                                            วันที่ผลิต (MFG)
                                        </label>
                                        <Input
                                            type="date"
                                            value={mfgDate}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setMfgDate(val);
                                                checkMfgWarning(val);
                                                // Auto-calculate EXP
                                                if (val && product.shelfLife) {
                                                    const mfg = new Date(val);
                                                    mfg.setMonth(mfg.getMonth() + product.shelfLife);
                                                    setExpDate(mfg.toISOString().split('T')[0]);
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-red-500" />
                                            วันหมดอายุ (EXP)
                                        </label>
                                        <Input
                                            type="date"
                                            value={expDate}
                                            onChange={(e) => setExpDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                                {mfgWarning && (
                                    <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-xs">
                                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                        <span>{mfgWarning}</span>
                                    </div>
                                )}
                                {product.shelfLife > 0 && (
                                    <p className="text-[10px] text-slate-400">
                                        * กำหนดวันหมดอายุให้ท่านอัตโนมัติ (MFG + {product.shelfLife} เดือน)
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        ยกเลิก
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading || totalPieces === 0}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Package className="w-4 h-4 mr-2" />
                        )}
                        เพิ่มสินค้า
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
