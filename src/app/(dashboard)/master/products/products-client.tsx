"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Plus,
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    Package,
    Loader2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 50;

interface Product {
    id: number;
    productCode: string;
    productName: string;
    principalProductCode: string | null;
    pieceBarcode: string | null;
    packBarcode: string | null;
    innerBarcode: string | null;
    caseBarcode: string | null;
    shelfLife: number;
    reorderPoint: number | null;
    stockControl: string;
    caseWeight: number;
    caseWidth: number;
    caseLength: number;
    caseHeight: number;
    caseVolume: number;
    principalCode: string | null;
    brandCode: string | null;
    baseUomCode: string | null;
    status: string;
    principal: { principalName: string } | null;
    brand: { brandName: string } | null;
}

interface Principal {
    principalCode: string;
    principalName: string;
}

interface Brand {
    brandCode: string;
    brandName: string;
}

interface UOM {
    uomCode: string;
    uomName: string;
}

interface ProductsClientProps {
    initialProducts: Product[];
    principals: Principal[];
    brands: Brand[];
    uoms: UOM[];
    userRole: number;
}

export function ProductsClient({
    initialProducts,
    principals,
    brands,
    uoms,
    userRole
}: ProductsClientProps) {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Pagination logic
    const filteredProducts = products.filter(
        (product) =>
            product.productCode.toLowerCase().includes(search.toLowerCase()) ||
            product.productName.toLowerCase().includes(search.toLowerCase())
    );
    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Reset page when search changes
    const handleSearchChange = (value: string) => {
        setSearch(value);
        setCurrentPage(1);
    };

    // Form state
    const [formData, setFormData] = useState({
        productCode: "",
        productName: "",
        principalProductCode: "",
        pieceBarcode: "",
        packBarcode: "",
        innerBarcode: "",
        caseBarcode: "",
        shelfLife: 0,
        reorderPoint: 0,
        stockControl: "FEFO",
        caseWeight: 0,
        caseWidth: 0,
        caseLength: 0,
        caseHeight: 0,
        caseVolume: 0,
        principalCode: "",
        brandCode: "",
        baseUomCode: "",
    });


    const resetForm = () => {
        setFormData({
            productCode: "",
            productName: "",
            principalProductCode: "",
            pieceBarcode: "",
            packBarcode: "",
            innerBarcode: "",
            caseBarcode: "",
            shelfLife: 0,
            reorderPoint: 0,
            stockControl: "FEFO",
            caseWeight: 0,
            caseWidth: 0,
            caseLength: 0,
            caseHeight: 0,
            caseVolume: 0,
            principalCode: "",
            brandCode: "",
            baseUomCode: "",
        });
        setEditingProduct(null);
    };

    const handleOpenDialog = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                productCode: product.productCode,
                productName: product.productName,
                principalProductCode: product.principalProductCode || "",
                pieceBarcode: product.pieceBarcode || "",
                packBarcode: product.packBarcode || "",
                innerBarcode: product.innerBarcode || "",
                caseBarcode: product.caseBarcode || "",
                shelfLife: product.shelfLife || 0,
                reorderPoint: product.reorderPoint || 0,
                stockControl: product.stockControl || "FEFO",
                caseWeight: Number(product.caseWeight) || 0,
                caseWidth: Number(product.caseWidth) || 0,
                caseLength: Number(product.caseLength) || 0,
                caseHeight: Number(product.caseHeight) || 0,
                caseVolume: Number(product.caseVolume) || 0,
                principalCode: product.principalCode || "",
                brandCode: product.brandCode || "",
                baseUomCode: product.baseUomCode || "",
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (editingProduct) {
                // Update
                const res = await fetch(`/api/products/${editingProduct.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });

                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.error || "Failed to update product");
                }

                const updated = await res.json();
                setProducts(products.map((p) => (p.id === updated.id ? updated : p)));
                toast.success("แก้ไขสินค้าสำเร็จ");
            } else {
                // Create
                const res = await fetch("/api/products", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });

                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.error || "Failed to create product");
                }

                const created = await res.json();
                setProducts([created, ...products]);
                toast.success("เพิ่มสินค้าสำเร็จ");
            }

            setIsDialogOpen(false);
            resetForm();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (product: Product) => {
        if (!confirm(`ต้องการลบสินค้า "${product.productName}" ใช่หรือไม่?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/products/${product.id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete product");

            setProducts(products.filter((p) => p.id !== product.id));
            toast.success("ลบสินค้าสำเร็จ");
        } catch {
            toast.error("ไม่สามารถลบสินค้าได้");
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Package className="w-7 h-7" />
                        จัดการสินค้า
                    </h1>
                    <p className="text-slate-500">รายการสินค้าทั้งหมด {products.length} รายการ</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={() => handleOpenDialog()}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            เพิ่มสินค้า
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col p-0">
                        <DialogHeader className="p-6 pb-2">
                            <DialogTitle>
                                {editingProduct ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4">
                            <div className="space-y-6">
                                {/* ส่วนที่ 1: ข้อมูลพื้นฐาน */}
                                <div>
                                    <h3 className="text-sm font-semibold text-blue-600 mb-3 flex items-center gap-2">
                                        <div className="w-1 h-4 bg-blue-600 rounded-full" />
                                        ข้อมูลพื้นฐาน
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="productCode">รหัสสินค้า *</Label>
                                            <Input
                                                id="productCode"
                                                value={formData.productCode}
                                                onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                                                placeholder="PROD001"
                                                disabled={!!editingProduct}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="principalProductCode">รหัสสินค้าซัพพลายเออร์</Label>
                                            <Input
                                                id="principalProductCode"
                                                value={formData.principalProductCode}
                                                onChange={(e) => setFormData({ ...formData, principalProductCode: e.target.value })}
                                                placeholder="REF-001"
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <Label htmlFor="productName">ชื่อสินค้า *</Label>
                                            <Input
                                                id="productName"
                                                value={formData.productName}
                                                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                                                placeholder="ชื่อสินค้าภาษาไทย หรือ อังกฤษ"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="principalCode">ซัพพลายเออร์</Label>
                                            <select
                                                id="principalCode"
                                                value={formData.principalCode}
                                                onChange={(e) => setFormData({ ...formData, principalCode: e.target.value })}
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                            >
                                                <option value="">เลือกซัพพลายเออร์</option>
                                                {principals.map((p) => (
                                                    <option key={p.principalCode} value={p.principalCode}>
                                                        {p.principalName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="brandCode">แบรนด์</Label>
                                            <select
                                                id="brandCode"
                                                value={formData.brandCode}
                                                onChange={(e) => setFormData({ ...formData, brandCode: e.target.value })}
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                            >
                                                <option value="">เลือกแบรนด์</option>
                                                {brands.map((b) => (
                                                    <option key={b.brandCode} value={b.brandCode}>
                                                        {b.brandName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* ส่วนที่ 2: บาร์โค้ด */}
                                <div>
                                    <h3 className="text-sm font-semibold text-blue-600 mb-3 flex items-center gap-2">
                                        <div className="w-1 h-4 bg-blue-600 rounded-full" />
                                        บาร์โค้ด (Barcodes)
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="pieceBarcode">Piece Barcode</Label>
                                            <Input
                                                id="pieceBarcode"
                                                value={formData.pieceBarcode}
                                                onChange={(e) => setFormData({ ...formData, pieceBarcode: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="packBarcode">Pack Barcode</Label>
                                            <Input
                                                id="packBarcode"
                                                value={formData.packBarcode}
                                                onChange={(e) => setFormData({ ...formData, packBarcode: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="innerBarcode">Inner Barcode</Label>
                                            <Input
                                                id="innerBarcode"
                                                value={formData.innerBarcode}
                                                onChange={(e) => setFormData({ ...formData, innerBarcode: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="caseBarcode">Case Barcode</Label>
                                            <Input
                                                id="caseBarcode"
                                                value={formData.caseBarcode}
                                                onChange={(e) => setFormData({ ...formData, caseBarcode: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ส่วนที่ 3: การควบคุมสต็อก */}
                                <div>
                                    <h3 className="text-sm font-semibold text-blue-600 mb-3 flex items-center gap-2">
                                        <div className="w-1 h-4 bg-blue-600 rounded-full" />
                                        การควบคุมสต็อก (Stock Control)
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="stockControl">Stock Control</Label>
                                            <select
                                                id="stockControl"
                                                value={formData.stockControl}
                                                onChange={(e) => setFormData({ ...formData, stockControl: e.target.value })}
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                            >
                                                <option value="FEFO">FEFO (หมดอายุตัวใกล้)</option>
                                                <option value="FIFO">FIFO (เข้าก่อน-ออกก่อน)</option>
                                                <option value="LIFO">LIFO (เข้าหลัง-ออกก่อน)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="shelfLife">Shelf Life (เดือน)</Label>
                                            <Input
                                                id="shelfLife"
                                                type="number"
                                                value={formData.shelfLife}
                                                onChange={(e) => setFormData({ ...formData, shelfLife: parseInt(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="reorderPoint">จุดสั่งซื้อ (Min)</Label>
                                            <Input
                                                id="reorderPoint"
                                                type="number"
                                                value={formData.reorderPoint || 0}
                                                onChange={(e) => setFormData({ ...formData, reorderPoint: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ส่วนที่ 4: ข้อมูลขนาด (Dimensions) */}
                                <div>
                                    <h3 className="text-sm font-semibold text-blue-600 mb-3 flex items-center gap-2">
                                        <div className="w-1 h-4 bg-blue-600 rounded-full" />
                                        ข้อมูลขนาดและน้ำหนัก (Dimensions)
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4 border p-4 rounded-lg bg-slate-50">
                                        <div className="space-y-2">
                                            <Label>น้ำหนัก (Kg)</Label>
                                            <Input
                                                type="number"
                                                step="0.0001"
                                                value={formData.caseWeight}
                                                onChange={(e) => setFormData({ ...formData, caseWeight: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>กว้าง (Cm)</Label>
                                            <Input
                                                type="number"
                                                step="0.0001"
                                                value={formData.caseWidth}
                                                onChange={(e) => setFormData({ ...formData, caseWidth: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>ยาว (Cm)</Label>
                                            <Input
                                                type="number"
                                                step="0.0001"
                                                value={formData.caseLength}
                                                onChange={(e) => setFormData({ ...formData, caseLength: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>สูง (Cm)</Label>
                                            <Input
                                                type="number"
                                                step="0.0001"
                                                value={formData.caseHeight}
                                                onChange={(e) => setFormData({ ...formData, caseHeight: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Volume (CBM)</Label>
                                            <Input
                                                type="number"
                                                step="0.0001"
                                                value={formData.caseVolume}
                                                onChange={(e) => setFormData({ ...formData, caseVolume: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="baseUomCode">หน่วยนับพื้นฐาน</Label>
                                            <select
                                                id="baseUomCode"
                                                value={formData.baseUomCode}
                                                onChange={(e) => setFormData({ ...formData, baseUomCode: e.target.value })}
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                            >
                                                <option value="">เลือกหน่วยนับ</option>
                                                {uoms.map((uom) => (
                                                    <option key={uom.uomCode} value={uom.uomCode}>
                                                        {uom.uomName} ({uom.uomCode})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>

                        <DialogFooter className="p-6 border-t bg-slate-50">
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    ยกเลิก
                                </Button>
                            </DialogClose>
                            <Button onClick={handleSubmit} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {editingProduct ? "บันทึกข้อมูล" : "เพิ่มสินค้า"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                    placeholder="ค้นหาสินค้า..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Table */}
            <div className="border rounded-lg bg-white dark:bg-slate-800 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-700">
                            <TableHead className="font-semibold w-16">รูป</TableHead>
                            <TableHead className="font-semibold">รหัสสินค้า</TableHead>
                            <TableHead className="font-semibold">ชื่อสินค้า</TableHead>
                            <TableHead className="font-semibold">ซัพพลายเออร์</TableHead>
                            <TableHead className="font-semibold">แบรนด์</TableHead>
                            <TableHead className="font-semibold">หน่วย</TableHead>
                            <TableHead className="font-semibold">สถานะ</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-10 text-slate-500">
                                    ไม่พบข้อมูลสินค้า
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedProducts.map((product) => (
                                <TableRow key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <TableCell>
                                        <img
                                            src={`/products/${product.productCode}.jpg`}
                                            alt={product.productName}
                                            className="w-12 h-12 object-cover rounded-md border bg-gray-50"
                                            onError={(e) => {
                                                const img = e.target as HTMLImageElement;
                                                // ลอง .png ถ้า .jpg ไม่มี
                                                if (img.src.endsWith('.jpg')) {
                                                    img.src = `/products/${product.productCode}.png`;
                                                } else {
                                                    img.src = '/products/no-img.jpg';
                                                }
                                            }}
                                        />

                                    </TableCell>
                                    <TableCell className="font-medium">{product.productCode}</TableCell>
                                    <TableCell>{product.productName}</TableCell>
                                    <TableCell>{product.principal?.principalName || "-"}</TableCell>
                                    <TableCell>{product.brand?.brandName || "-"}</TableCell>
                                    <TableCell>{product.baseUomCode || "-"}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                                            {product.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleOpenDialog(product)}>
                                                    <Pencil className="w-4 h-4 mr-2" />
                                                    แก้ไข
                                                </DropdownMenuItem>
                                                {userRole >= 7 && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(product)}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        ลบ
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-slate-500">
                        แสดง {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredProducts.length)} จาก {filteredProducts.length} รายการ
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={currentPage === pageNum ? "bg-blue-600" : ""}
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
