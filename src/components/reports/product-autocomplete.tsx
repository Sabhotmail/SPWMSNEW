"use client";

import { useEffect, useState, useRef } from "react";
import { Search, Loader2, Package } from "lucide-react";

interface Product {
    productCode: string;
    productName: string;
}

interface ProductAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onEnter?: () => void;
    placeholder?: string;
    className?: string; // Additional classes for the input
}

export function ProductAutocomplete({ value, onChange, onEnter, placeholder, className }: ProductAutocompleteProps) {
    const [inputValue, setInputValue] = useState(value);
    const [suggestions, setSuggestions] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchProducts = async (search: string) => {
        if (search.length < 2) {
            setSuggestions([]);
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch(`/api/products?search=${encodeURIComponent(search)}&limit=10`);
            const json = await res.json();
            if (json.data) {
                setSuggestions(json.data);
            }
        } catch (error) {
            console.error("Failed to fetch products for autocomplete", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);
        onChange(val); // Update parent state immediately for manual entry
        setIsOpen(true);
        fetchProducts(val);
    };

    const handleSelect = (product: Product) => {
        setInputValue(product.productCode);
        onChange(product.productCode);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <div className="relative">
                <input
                    type="text"
                    className={className || "w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-transparent text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"}
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            setIsOpen(false);
                            onEnter?.();
                        }
                    }}
                    onFocus={() => {
                        if (inputValue.length >= 2) {
                            setIsOpen(true);
                            fetchProducts(inputValue);
                        }
                    }}
                />
                {isLoading ? (
                    <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                ) : (
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                )}
            </div>

            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    {suggestions.map((p) => (
                        <div
                            key={p.productCode}
                            className="flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                            onClick={() => handleSelect(p)}
                        >
                            <div className="mt-0.5 p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                <Package className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                    {p.productCode}
                                </span>
                                <span className="text-xs text-slate-500 line-clamp-1">
                                    {p.productName}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
