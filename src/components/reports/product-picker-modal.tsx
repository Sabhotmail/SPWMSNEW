"use client";

import { useState, useEffect } from "react";
import { X, Search, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Product {
    productCode: string;
    productName: string;
    brand?: { brandName: string } | null;
    principal?: { principalName: string } | null;
}

interface ProductPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (productCode: string) => void;
}

export function ProductPickerModal({ isOpen, onClose, onSelect }: ProductPickerModalProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchProducts = async (search: string, pageNum: number) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/products?search=${encodeURIComponent(search)}&limit=15&page=${pageNum}`);
            const json = await res.json();
            if (json.data) {
                setProducts(json.data);
                setTotalPages(json.pagination?.totalPages || 1);
            }
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchProducts("", 1);
            setSearchTerm("");
            setPage(1);
        }
    }, [isOpen]);

    const handleSearch = () => {
        setPage(1);
        fetchProducts(searchTerm, 1);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        fetchProducts(searchTerm, newPage);
    };

    const handleSelect = (productCode: string) => {
        onSelect(productCode);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5 text-white flex-shrink-0">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Package className="w-6 h-6" />
                        เลือกสินค้า
                    </h2>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-slate-100 flex-shrink-0">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="ค้นหารหัสสินค้าหรือชื่อสินค้า..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                        <Button
                            onClick={handleSearch}
                            className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6 rounded-xl"
                        >
                            ค้นหา
                        </Button>
                    </div>
                </div>

                {/* Product List */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <Package className="w-12 h-12 mb-3" />
                            <p>ไม่พบสินค้า</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {products.map((product) => (
                                <div
                                    key={product.productCode}
                                    onClick={() => handleSelect(product.productCode)}
                                    className="flex items-center gap-4 p-4 hover:bg-indigo-50 cursor-pointer transition-colors"
                                >
                                    <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600 flex-shrink-0">
                                        <Package className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-900">{product.productCode}</p>
                                        <p className="text-sm text-slate-600 truncate">{product.productName}</p>
                                        {(product.brand || product.principal) && (
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {product.principal?.principalName} {product.brand?.brandName && `• ${product.brand.brandName}`}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex-shrink-0">
                                        <Button
                                            size="sm"
                                            className="bg-indigo-600 hover:bg-indigo-700 rounded-lg px-4"
                                        >
                                            เลือก
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-center gap-2 flex-shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page <= 1}
                            className="rounded-lg"
                        >
                            ก่อนหน้า
                        </Button>
                        <span className="text-sm text-slate-600 px-4">
                            หน้า {page} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page >= totalPages}
                            className="rounded-lg"
                        >
                            ถัดไป
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
