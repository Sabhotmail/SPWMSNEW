"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Plus,
    Trash2,
    Save,
    ArrowLeft,
    Loader2,
    Search,
    Download,
    X,
    Split,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Product {
    id: number;
    productCode: string;
    productName: string;
    baseUomCode: string | null;
    shelfLife?: number; // in months
}

interface Warehouse {
    whCode: string;
    whName: string;
}

interface TransactionItem {
    id: string; // temp id for UI
    productCode: string;
    productName: string;
    qty: number;
    uomCode: string;
    uomRatio: number; // e.g., 1 CTN = 12 PCS
    pieceQty: number; // calculated: qty * uomRatio
    availableUOMs: { uomCode: string; uomName: string; uomRatio: number }[];
    locCode: string;
    lotNo?: string;
    mfgDate?: string;
    expDate?: string;
    remark?: string;
    shelfLife?: number; // in months
}

interface Location {
    locCode: string;
    locName: string | null;
}

interface MovementType {
    movementTypeCode: string;
    movementTypeName: string;
    direction: string;
}

interface TransactionFormProps {
    type: "GR" | "GI" | "TRN" | "IN" | "OUT" | "ADJ"; // Goods Receipt, Goods Issue, Transfer, or Legacy codes
    warehouses: Warehouse[];
    products: Product[];
    backUrl: string;
    headerOnly?: boolean;
}

export function TransactionForm({ type, warehouses, products, backUrl, headerOnly = false }: TransactionFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [whCode, setWhCode] = useState("");
    const [toWhCode, setToWhCode] = useState("");
    const [remark, setRemark] = useState("");
    const [items, setItems] = useState<TransactionItem[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [movementTypes, setMovementTypes] = useState<MovementType[]>([]);

    // Additional header fields
    const [ref1, setRef1] = useState("");
    const [ref2, setRef2] = useState("");
    const [ref3, setRef3] = useState("");
    const [movementTypeCode, setMovementTypeCode] = useState("");
    const [salesmanCode, setSalesmanCode] = useState("");

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [showProductList, setShowProductList] = useState(false);

    // Express API fetch state
    const [showExpressDialog, setShowExpressDialog] = useState(false);
    const [expressDocNo, setExpressDocNo] = useState("");
    const [isExpressLoading, setIsExpressLoading] = useState(false);

    // Split lot state
    const [showSplitDialog, setShowSplitDialog] = useState(false);
    const [splitItem, setSplitItem] = useState<TransactionItem | null>(null);
    const [splitRows, setSplitRows] = useState<Array<{ qty: number; mfgDate: string; expDate: string }>>([]);

    // Open split dialog for an item
    const openSplitDialog = (item: TransactionItem) => {
        setSplitItem(item);
        setSplitRows([{ qty: item.qty, mfgDate: "", expDate: "" }]);
        setShowSplitDialog(true);
    };

    // Add a new split row
    const addSplitRow = () => {
        setSplitRows([...splitRows, { qty: 0, mfgDate: "", expDate: "" }]);
    };

    // Update split row - auto-calculate EXP when MFG changes
    const updateSplitRow = (index: number, field: string, value: string | number) => {
        setSplitRows(splitRows.map((row, i) => {
            if (i !== index) return row;

            const updated = { ...row, [field]: value };

            // Auto-calculate EXP date when MFG date changes
            if (field === "mfgDate" && value && splitItem?.shelfLife) {
                const mfgDate = new Date(value as string);
                mfgDate.setMonth(mfgDate.getMonth() + splitItem.shelfLife);
                updated.expDate = mfgDate.toISOString().split("T")[0];
            }

            return updated;
        }));
    };

    // Remove split row
    const removeSplitRow = (index: number) => {
        if (splitRows.length > 1) {
            setSplitRows(splitRows.filter((_, i) => i !== index));
        }
    };

    // Confirm split
    const confirmSplit = () => {
        if (!splitItem) return;

        const totalSplitQty = splitRows.reduce((sum, row) => sum + Number(row.qty), 0);
        if (totalSplitQty !== splitItem.qty) {
            toast.error(`ยอดรวมที่แยก (${totalSplitQty}) ต้องเท่ากับยอดเดิม (${splitItem.qty})`);
            return;
        }

        // Filter out zero quantity rows
        const validRows = splitRows.filter(row => Number(row.qty) > 0);
        if (validRows.length === 0) {
            toast.error("กรุณาระบุจำนวนอย่างน้อย 1 รายการ");
            return;
        }

        // Create new items from split rows
        const newItems: TransactionItem[] = validRows.map(row => ({
            ...splitItem,
            id: Math.random().toString(36).substr(2, 9),
            qty: Number(row.qty),
            pieceQty: Number(row.qty) * splitItem.uomRatio,
            mfgDate: row.mfgDate || undefined,
            expDate: row.expDate || undefined,
        }));

        // Replace original item with new split items
        setItems(prevItems => {
            const index = prevItems.findIndex(i => i.id === splitItem.id);
            if (index === -1) return prevItems;
            return [
                ...prevItems.slice(0, index),
                ...newItems,
                ...prevItems.slice(index + 1)
            ];
        });

        toast.success(`แยกสินค้าเป็น ${newItems.length} ล็อต`);
        setShowSplitDialog(false);
        setSplitItem(null);
    };

    // Fetch movement types on mount
    useEffect(() => {
        fetch("/api/movement-types")
            .then(res => res.json())
            .then(data => {
                // Filter by document type direction (ADJ allows both IN and OUT)
                if (type === "ADJ") {
                    setMovementTypes(
                        data.filter(
                            (mt: MovementType) =>
                                mt.direction === "IN" || mt.direction === "OUT"
                        )
                    );
                } else {
                    const direction =
                        type === "GR" || type === "IN"
                            ? "IN"
                            : type === "GI" || type === "OUT"
                              ? "OUT"
                              : null;
                    if (direction) {
                        setMovementTypes(
                            data.filter((mt: MovementType) => mt.direction === direction)
                        );
                    } else {
                        setMovementTypes(data);
                    }
                }
            })
            .catch(err => console.error("Error fetching movement types:", err));
    }, [type]);

    // Fetch locations when whCode changes
    useEffect(() => {
        if (whCode) {
            fetch(`/api/warehouses/${whCode}/locations`)
                .then(res => res.json())
                .then(data => setLocations(data))
                .catch(err => console.error("Error fetching locations:", err));
        } else {
            setLocations([]);
        }
    }, [whCode]);

    const filteredProducts = products.filter(p =>
        p.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.productName.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);

    // Fetch items from Express API
    const fetchFromExpress = async () => {
        if (!expressDocNo.trim()) {
            toast.error("กรุณาระบุเลขที่เอกสาร");
            return;
        }

        setIsExpressLoading(true);
        try {
            const res = await fetch("/api/external/express/documents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documentNo: expressDocNo }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "ไม่สามารถดึงข้อมูลได้");
            }

            // Process items from Express
            const expressItems = data.document.items || [];
            const newItems: TransactionItem[] = [];

            for (const item of expressItems) {
                // Fetch UOMs and product info for this product
                let availableUOMs: { uomCode: string; uomName: string; uomRatio: number }[] = [];
                let shelfLife = 0;
                try {
                    const uomRes = await fetch(`/api/products/${item.productCode}/uoms`);
                    if (uomRes.ok) {
                        const uomData = await uomRes.json();
                        availableUOMs = uomData.uoms || [];
                        shelfLife = uomData.shelfLife || 0;
                    }
                } catch {
                    // Ignore UOM fetch errors
                }

                if (availableUOMs.length === 0) {
                    availableUOMs = [{ uomCode: item.uomCode || "PCS", uomName: item.uomCode || "PCS", uomRatio: 1 }];
                }

                const selectedUOM = availableUOMs.find(u => u.uomCode === item.uomCode) || availableUOMs[0];

                newItems.push({
                    id: Math.random().toString(36).substr(2, 9),
                    productCode: item.productCode,
                    productName: item.productName,
                    qty: item.qty,
                    uomCode: selectedUOM.uomCode,
                    uomRatio: selectedUOM.uomRatio,
                    pieceQty: item.qty * selectedUOM.uomRatio,
                    availableUOMs,
                    locCode: "",
                    shelfLife,
                });
            }

            // Add new items to existing items
            setItems(prev => [...prev, ...newItems]);

            // Set ref1 to document number
            if (!ref1) {
                setRef1(expressDocNo);
            }

            toast.success(`ดึงข้อมูล ${newItems.length} รายการจากเอกสาร ${expressDocNo} สำเร็จ`);
            setShowExpressDialog(false);
            setExpressDocNo("");

        } catch (error) {
            toast.error(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
        } finally {
            setIsExpressLoading(false);
        }
    };

    const addItem = async (product: Product) => {
        // Fetch available UOMs and shelfLife for this product
        let availableUOMs: { uomCode: string; uomName: string; uomRatio: number }[] = [];
        let shelfLife = 0;
        try {
            const res = await fetch(`/api/products/${product.productCode}/uoms`);
            if (res.ok) {
                const data = await res.json();
                availableUOMs = data.uoms || [];
                shelfLife = data.shelfLife || 0;
            }
        } catch (err) {
            console.error("Error fetching product UOMs:", err);
        }

        // Default to base UOM if no UOMs found
        if (availableUOMs.length === 0) {
            availableUOMs = [{ uomCode: product.baseUomCode || "PCS", uomName: product.baseUomCode || "PCS", uomRatio: 1 }];
        }

        const defaultUOM = availableUOMs.find(u => u.uomRatio === 1) || availableUOMs[0];

        const newItem: TransactionItem = {
            id: Math.random().toString(36).substr(2, 9),
            productCode: product.productCode,
            productName: product.productName,
            qty: 1,
            uomCode: defaultUOM.uomCode,
            uomRatio: defaultUOM.uomRatio,
            pieceQty: 1 * defaultUOM.uomRatio,
            availableUOMs,
            locCode: "",
            shelfLife,
        };
        setItems([...items, newItem]);
        setSearchQuery("");
        setShowProductList(false);
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const updateItem = (id: string, field: keyof TransactionItem, value: any) => {
        setItems(items.map(item => {
            if (item.id !== id) return item;

            const updated = { ...item, [field]: value };

            // Recalculate pieceQty when qty or uomCode changes
            if (field === "qty" || field === "uomCode") {
                const qty = field === "qty" ? Number(value) : item.qty;
                let ratio = item.uomRatio;

                if (field === "uomCode") {
                    const selectedUOM = item.availableUOMs.find(u => u.uomCode === value);
                    ratio = selectedUOM?.uomRatio || 1;
                    updated.uomRatio = ratio;
                }

                updated.pieceQty = qty * ratio;
            }

            // Auto-calculate EXP date when MFG date changes
            if (field === "mfgDate" && value && item.shelfLife && item.shelfLife > 0) {
                const mfgDate = new Date(value as string);
                mfgDate.setMonth(mfgDate.getMonth() + item.shelfLife);
                updated.expDate = mfgDate.toISOString().split("T")[0];
            }

            return updated;
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!headerOnly && items.length === 0) {
            toast.error("กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ");
            return;
        }
        if (!whCode) {
            toast.error("กรุณาเลือกคลังสินค้า");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    docTypeCode: type,
                    whCode,
                    toWhCode: type === "TRN" ? toWhCode : null,
                    ref1,
                    ref2,
                    ref3,
                    movementTypeCode: movementTypeCode || null,
                    salesmanCode: salesmanCode || null,
                    remark,
                    items: headerOnly ? [] : items.map(({ productCode, qty, uomCode, uomRatio, pieceQty, lotNo, mfgDate, expDate, remark, locCode }) => ({
                        productCode,
                        qty: Number(qty),
                        uomCode,
                        uomRatio: uomRatio || 1,
                        pieceQty: pieceQty || Number(qty),
                        locCode,
                        lotNo,
                        mfgDate,
                        expDate,
                        remark
                    }))

                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to create transaction");
            }

            const data = await res.json();
            toast.success("บันทึกเอกสารร่างสำเร็จ");

            if (headerOnly) {
                router.push(`/transactions/${data.id}`);
            } else {
                router.push(backUrl);
            }
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.push(backUrl)}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <h1 className="text-2xl font-bold">
                    สร้างใบ{(type === "GR" || type === "IN") ? "รับสินค้า" : (type === "GI" || type === "OUT") ? "จ่ายสินค้า" : type === "ADJ" ? "ปรับปรุงสต๊อก" : "โอนย้ายสินค้า"}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className={`grid grid-cols-1 ${headerOnly ? "" : "md:grid-cols-3"} gap-6`}>
                    {/* Header Info */}
                    <Card className={`${headerOnly ? "max-w-2xl mx-auto" : "md:col-span-1"} border-0 shadow-sm w-full`}>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">ข้อมูลทั่วไป</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="whCode">คลังสินค้า *</Label>
                                <select
                                    id="whCode"
                                    value={whCode}
                                    onChange={(e) => setWhCode(e.target.value)}
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                    required
                                >
                                    <option value="">เลือกคลังสินค้า</option>
                                    {warehouses.map((wh) => (
                                        <option key={wh.whCode} value={wh.whCode}>
                                            {wh.whName} ({wh.whCode})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {type === "TRN" && (
                                <div className="space-y-2">
                                    <Label htmlFor="toWhCode">คลังสินค้าปลายทาง *</Label>
                                    <select
                                        id="toWhCode"
                                        value={toWhCode}
                                        onChange={(e) => setToWhCode(e.target.value)}
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                        required
                                    >
                                        <option value="">เลือกคลังปลายทาง</option>
                                        {warehouses
                                            .filter(wh => wh.whCode !== whCode)
                                            .map((wh) => (
                                                <option key={wh.whCode} value={wh.whCode}>
                                                    {wh.whName} ({wh.whCode})
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            )}

                            {/* Movement Type */}
                            {movementTypes.length > 0 && (
                                <div className="space-y-2">
                                    <Label htmlFor="movementTypeCode">ประเภทการเคลื่อนไหว</Label>
                                    <select
                                        id="movementTypeCode"
                                        value={movementTypeCode}
                                        onChange={(e) => setMovementTypeCode(e.target.value)}
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                    >
                                        <option value="">-- เลือก --</option>
                                        {movementTypes.map((mt) => (
                                            <option key={mt.movementTypeCode} value={mt.movementTypeCode}>
                                                {mt.movementTypeName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Salesman Code (for Issue only) */}
                            {(type === "GI" || type === "OUT") && (
                                <div className="space-y-2">
                                    <Label htmlFor="salesmanCode">รหัสพนักงานขาย</Label>
                                    <Input
                                        id="salesmanCode"
                                        value={salesmanCode}
                                        onChange={(e) => setSalesmanCode(e.target.value)}
                                        placeholder="เช่น SM001"
                                    />
                                </div>
                            )}

                            {/* Reference Fields */}
                            <div className="pt-2 border-t">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[10px] uppercase font-bold text-slate-400">เลขที่อ้างอิง</p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowExpressDialog(true)}
                                        className="h-7 text-xs gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                                    >
                                        <Download className="w-3 h-3" />
                                        ดึงจาก Express
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    <Input
                                        placeholder="Ref.1 (เช่น PO Number)"
                                        value={ref1}
                                        onChange={(e) => setRef1(e.target.value)}
                                        className="h-9 text-sm"
                                    />
                                    <Input
                                        placeholder="Ref.2 (เช่น Invoice)"
                                        value={ref2}
                                        onChange={(e) => setRef2(e.target.value)}
                                        className="h-9 text-sm"
                                    />
                                    <Input
                                        placeholder="Ref.3 (อื่นๆ)"
                                        value={ref3}
                                        onChange={(e) => setRef3(e.target.value)}
                                        className="h-9 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="remark">หมายเหตุ</Label>
                                <textarea
                                    id="remark"
                                    value={remark}
                                    onChange={(e) => setRemark(e.target.value)}
                                    className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm"
                                    placeholder="รายละเอียดเพิ่มเติม..."
                                />
                            </div>
                        </CardContent>
                    </Card>


                    {/* Items Table */}
                    {!headerOnly && (
                        <Card className="md:col-span-2 border-0 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">รายการสินค้า</CardTitle>
                                <div className="relative">
                                    <div className="flex items-center border rounded-md px-2 bg-slate-50">
                                        <Search className="w-4 h-4 text-slate-400 mr-2" />
                                        <Input
                                            placeholder="รหัส หรือ ชื่อสินค้า..."
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                setShowProductList(true);
                                            }}
                                            onFocus={() => setShowProductList(true)}
                                            className="border-0 bg-transparent focus-visible:ring-0 w-[200px]"
                                        />
                                    </div>
                                    {showProductList && searchQuery && (
                                        <div className="absolute top-full right-0 mt-1 w-[300px] bg-white border rounded-md shadow-lg z-50 overflow-hidden">
                                            {filteredProducts.length > 0 ? (
                                                filteredProducts.map(p => (
                                                    <div
                                                        key={p.id}
                                                        className="p-2 hover:bg-slate-50 cursor-pointer text-sm border-b last:border-0"
                                                        onClick={() => addItem(p)}
                                                    >
                                                        <div className="font-bold">{p.productCode}</div>
                                                        <div className="text-slate-500">{p.productName}</div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center text-sm text-slate-500">ไม่พบสินค้า</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {items.length === 0 ? (
                                    <div className="border-2 border-dashed border-slate-200 rounded-lg py-12 text-center">
                                        <div className="text-slate-400 mb-2">📦</div>
                                        <p className="text-slate-500 text-sm">ยังไม่มีรายการสินค้า</p>
                                        <p className="text-slate-400 text-xs mt-1">กรุณาค้นหาและเพิ่มสินค้าด้านบน</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {items.map((item, index) => (
                                            <div
                                                key={item.id}
                                                className="border rounded-lg p-4 bg-gradient-to-r from-slate-50 to-white hover:shadow-sm transition-shadow"
                                            >
                                                {/* Header Row */}
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-slate-800">{item.productCode}</div>
                                                            <div className="text-sm text-slate-500">{item.productName}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {(type === "GR" || type === "IN") && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => openSplitDialog(item)}
                                                                className="h-8 text-xs gap-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                            >
                                                                <Split className="w-3 h-3" />
                                                                แยกล็อต
                                                            </Button>
                                                        )}
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeItem(item.id)}
                                                            className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Input Fields - Row 1 */}
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">จำนวน</label>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            value={item.qty}
                                                            onChange={(e) => updateItem(item.id, "qty", e.target.value)}
                                                            className="h-9 text-center font-bold text-lg"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">หน่วย</label>
                                                        <select
                                                            value={item.uomCode}
                                                            onChange={(e) => updateItem(item.id, "uomCode", e.target.value)}
                                                            className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm"
                                                        >
                                                            {item.availableUOMs.map((uom) => (
                                                                <option key={uom.uomCode} value={uom.uomCode}>
                                                                    {uom.uomName} {uom.uomRatio > 1 ? `(${uom.uomRatio})` : ""}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">= ชิ้น</label>
                                                        <div className="h-9 px-3 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center">
                                                            <span className="font-bold text-blue-600">{item.pieceQty?.toLocaleString() || item.qty}</span>
                                                            <span className="text-xs text-blue-400 ml-1">PCS</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Input Fields - Row 2 (for inbound only) */}
                                                {(type === "GR" || type === "IN") && (
                                                    <div className="grid grid-cols-3 gap-3 mt-3">
                                                        <div>
                                                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">วันผลิต (MFG)</label>
                                                            <Input
                                                                type="date"
                                                                value={item.mfgDate || ""}
                                                                onChange={(e) => updateItem(item.id, "mfgDate", e.target.value)}
                                                                className="h-9"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">วันหมดอายุ (EXP)</label>
                                                            <Input
                                                                type="date"
                                                                value={item.expDate || ""}
                                                                onChange={(e) => updateItem(item.id, "expDate", e.target.value)}
                                                                className="h-9"
                                                            />
                                                        </div>
                                                        <div className="flex items-end">
                                                            {item.shelfLife && item.shelfLife > 0 && (
                                                                <span className="text-xs text-slate-400 pb-2">อายุ {item.shelfLife} เดือน</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.push(backUrl)}>
                        ยกเลิก
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        บันทึกร่าง
                    </Button>
                </div>
            </form>

            {/* Express Document Fetch Dialog */}
            <Dialog open={showExpressDialog} onOpenChange={setShowExpressDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Download className="w-5 h-5 text-blue-600" />
                            ดึงข้อมูลจาก Express
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="expressDocNo">เลขที่เอกสาร</Label>
                            <Input
                                id="expressDocNo"
                                placeholder="เช่น PO20240001"
                                value={expressDocNo}
                                onChange={(e) => setExpressDocNo(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        fetchFromExpress();
                                    }
                                }}
                                disabled={isExpressLoading}
                            />
                            <p className="text-xs text-slate-500">
                                ระบุเลขที่เอกสาร PO, Invoice หรืออื่นๆ จากระบบ Express
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowExpressDialog(false)}
                            disabled={isExpressLoading}
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            type="button"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={fetchFromExpress}
                            disabled={isExpressLoading}
                        >
                            {isExpressLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    กำลังดึงข้อมูล...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    ดึงข้อมูล
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Split Lot Dialog */}
            <Dialog open={showSplitDialog} onOpenChange={setShowSplitDialog}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Split className="w-5 h-5 text-blue-600" />
                            แยกล็อตสินค้า
                        </DialogTitle>
                    </DialogHeader>
                    {splitItem && (
                        <div className="space-y-4 py-4">
                            <div className="bg-gradient-to-r from-blue-50 to-slate-50 p-4 rounded-lg border border-blue-100">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-blue-800">{splitItem.productCode}</p>
                                        <p className="text-sm text-slate-600">{splitItem.productName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-blue-600">{splitItem.qty} {splitItem.uomCode}</p>
                                        {splitItem.shelfLife && splitItem.shelfLife > 0 && (
                                            <p className="text-xs text-slate-500">อายุสินค้า: {splitItem.shelfLife} เดือน</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm font-medium">รายการแยกล็อต</p>
                                    <div className="flex items-center gap-2">
                                        <div className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100">
                                            แยกแล้ว: <span className={splitRows.reduce((sum, r) => sum + Number(r.qty), 0) === splitItem.qty ? "text-green-600" : "text-orange-500"}>{splitRows.reduce((sum, r) => sum + Number(r.qty), 0)}</span> / {splitItem.qty}
                                        </div>
                                    </div>
                                </div>

                                {splitRows.map((row, index) => (
                                    <div key={index} className="flex items-center gap-2 p-2 border rounded-lg bg-white">
                                        <div className="flex-1 grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-slate-400 block">จำนวน</label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max={splitItem.qty}
                                                    value={row.qty}
                                                    onChange={(e) => updateSplitRow(index, "qty", e.target.value)}
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-slate-400 block">วันผลิต</label>
                                                <Input
                                                    type="date"
                                                    value={row.mfgDate}
                                                    onChange={(e) => updateSplitRow(index, "mfgDate", e.target.value)}
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-slate-400 block">วันหมดอายุ</label>
                                                <Input
                                                    type="date"
                                                    value={row.expDate}
                                                    onChange={(e) => updateSplitRow(index, "expDate", e.target.value)}
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeSplitRow(index)}
                                            disabled={splitRows.length === 1}
                                            className="h-8 w-8 text-red-400 hover:text-red-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addSplitRow}
                                    className="w-full"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    เพิ่มล็อต
                                </Button>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowSplitDialog(false)}
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            type="button"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={confirmSplit}
                        >
                            <Split className="w-4 h-4 mr-2" />
                            ยืนยันการแยก
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
