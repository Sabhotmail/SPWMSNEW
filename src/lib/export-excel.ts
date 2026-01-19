"use client";

import * as XLSX from "xlsx";

interface ExportOptions {
    filename: string;
    sheetName?: string;
}

/**
 * Export data to Excel file
 * @param data - Array of objects to export
 * @param options - Export options (filename, sheetName)
 */
export function exportToExcel<T extends Record<string, any>>(
    data: T[],
    options: ExportOptions
) {
    const { filename, sheetName = "Sheet1" } = options;

    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Auto-size columns
    const maxWidth = 50;
    const colWidths = Object.keys(data[0] || {}).map((key) => {
        const maxLength = Math.max(
            key.length,
            ...data.map((row) => String(row[key] || "").length)
        );
        return { wch: Math.min(maxLength + 2, maxWidth) };
    });
    worksheet["!cols"] = colWidths;

    // Generate buffer and download
    XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Export stock ledger data to Excel
 */
export function exportStockLedger(
    productCode: string,
    productName: string,
    whCode: string,
    startDate: string,
    endDate: string,
    openingBalance: number,
    ledgerData: {
        docDate: string;
        docNo: string;
        refNo: string;
        mfgDate?: string;
        expDate?: string;
        inQty: number;
        outQty: number;
        runningBalance: number;
    }[]
) {
    // Prepare data for export
    const exportData = [
        // Header info
        {
            "วันที่บันทึก": `รายงานการเคลื่อนไหวสินค้า`,
            "เลขที่เอกสาร": "",
            "เอกสารอ้างอิง": "",
            "รับเข้า": "",
            "จ่ายออก": "",
            "ยอดคงเหลือ": "",
        },
        {
            "วันที่บันทึก": `รหัสสินค้า: ${productCode}`,
            "เลขที่เอกสาร": `ชื่อสินค้า: ${productName}`,
            "เอกสารอ้างอิง": "",
            "รับเข้า": "",
            "จ่ายออก": "",
            "ยอดคงเหลือ": "",
        },
        {
            "วันที่บันทึก": `คลัง: ${whCode}`,
            "เลขที่เอกสาร": `ช่วงวันที่: ${startDate} ถึง ${endDate}`,
            "เอกสารอ้างอิง": "",
            "รับเข้า": "",
            "จ่ายออก": "",
            "ยอดคงเหลือ": "",
        },
        {
            "วันที่บันทึก": "",
            "เลขที่เอกสาร": "",
            "เอกสารอ้างอิง": "",
            "รับเข้า": "",
            "จ่ายออก": "",
            "ยอดคงเหลือ": "",
        },
        // Opening balance
        {
            "วันที่บันทึก": startDate,
            "เลขที่เอกสาร": "ยอดยกมา",
            "เอกสารอ้างอิง": "",
            "รับเข้า": "-",
            "จ่ายออก": "-",
            "ยอดคงเหลือ": openingBalance,
        },
        // Ledger entries
        ...ledgerData.map((item) => ({
            "วันที่บันทึก": item.docDate,
            "เลขที่เอกสาร": item.docNo,
            "เอกสารอ้างอิง": item.refNo || "-",
            "รับเข้า": item.inQty > 0 ? item.inQty : "-",
            "จ่ายออก": item.outQty > 0 ? item.outQty : "-",
            "ยอดคงเหลือ": item.runningBalance,
        })),
    ];

    const filename = `StockLedger_${productCode}_${whCode}_${new Date().toISOString().split("T")[0]}`;
    exportToExcel(exportData, { filename, sheetName: "การเคลื่อนไหว" });
}

/**
 * Export stock balance data to Excel
 */
export function exportStockBalance(
    data: {
        productCode: string;
        productName: string;
        whCode: string;
        whName: string;
        qty: number;
        mfgDate?: string;
        expDate?: string;
    }[]
) {
    const exportData = data.map((item) => ({
        "รหัสสินค้า": item.productCode,
        "ชื่อสินค้า": item.productName,
        "คลังสินค้า": `${item.whCode} - ${item.whName}`,
        "จำนวน": item.qty,
        "MFG": item.mfgDate || "-",
        "EXP": item.expDate || "-",
    }));

    const filename = `StockBalance_${new Date().toISOString().split("T")[0]}`;
    exportToExcel(exportData, { filename, sheetName: "ยอดคงเหลือ" });
}

/**
 * Export stock card detail (MFG/EXP) to Excel
 */
export function exportStockCardDetail(
    productCode: string,
    productName: string,
    whCode: string,
    startDate: string,
    endDate: string,
    openingBalance: number,
    ledgerData: {
        docDate: string;
        docNo: string;
        refNo: string;
        mfgDate?: string;
        expDate?: string;
        inQty: number;
        outQty: number;
        runningBalance: number;
    }[]
) {
    const exportData = [
        // Header info
        {
            "วันที่": `รายงานการเคลื่อนไหว (MFG/EXP)`,
            "เลขที่เอกสาร": "",
            "เอกสารอ้างอิง": "",
            "MFG": "",
            "EXP": "",
            "รับเข้า": "",
            "จ่ายออก": "",
            "ยอดคงเหลือ": "",
        },
        {
            "วันที่": `รหัสสินค้า: ${productCode}`,
            "เลขที่เอกสาร": `ชื่อสินค้า: ${productName}`,
            "เอกสารอ้างอิง": "",
            "MFG": "",
            "EXP": "",
            "รับเข้า": "",
            "จ่ายออก": "",
            "ยอดคงเหลือ": "",
        },
        {
            "วันที่": `คลัง: ${whCode}`,
            "เลขที่เอกสาร": `ช่วงวันที่: ${startDate} ถึง ${endDate}`,
            "เอกสารอ้างอิง": "",
            "MFG": "",
            "EXP": "",
            "รับเข้า": "",
            "จ่ายออก": "",
            "ยอดคงเหลือ": "",
        },
        {
            "วันที่": "",
            "เลขที่เอกสาร": "",
            "เอกสารอ้างอิง": "",
            "MFG": "",
            "EXP": "",
            "รับเข้า": "",
            "จ่ายออก": "",
            "ยอดคงเหลือ": "",
        },
        // Opening balance
        {
            "วันที่": startDate,
            "เลขที่เอกสาร": "ยอดยกมา",
            "เอกสารอ้างอิง": "",
            "MFG": "-",
            "EXP": "-",
            "รับเข้า": "-",
            "จ่ายออก": "-",
            "ยอดคงเหลือ": openingBalance,
        },
        // Ledger entries
        ...ledgerData.map((item) => ({
            "วันที่": item.docDate,
            "เลขที่เอกสาร": item.docNo,
            "เอกสารอ้างอิง": item.refNo || "-",
            "MFG": item.mfgDate || "-",
            "EXP": item.expDate || "-",
            "รับเข้า": item.inQty > 0 ? item.inQty : "-",
            "จ่ายออก": item.outQty > 0 ? item.outQty : "-",
            "ยอดคงเหลือ": item.runningBalance,
        })),
    ];

    const filename = `StockCard_Detail_${productCode}_${whCode}_${new Date().toISOString().split("T")[0]}`;
    exportToExcel(exportData, { filename, sheetName: "สต็อกการ์ด_MFG_EXP" });
}
