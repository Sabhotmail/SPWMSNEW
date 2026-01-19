import * as XLSX from "xlsx";

interface ExportColumn {
    header: string;
    key: string;
    width?: number;
}

interface ExportOptions {
    filename: string;
    sheetName: string;
    columns: ExportColumn[];
    data: any[];
    metadata?: {
        title?: string;
        exportDate?: Date;
        exportBy?: string;
        filters?: Record<string, any>;
    };
}

export function exportToExcel(options: ExportOptions) {
    const {
        filename,
        sheetName,
        columns,
        data,
        metadata,
    } = options;

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Prepare data for export
    const exportData: any[] = [];

    // Add metadata if provided
    if (metadata) {
        if (metadata.title) {
            exportData.push([metadata.title]);
            exportData.push([]);
        }
        if (metadata.exportDate) {
            exportData.push([
                "วันที่ส่งออก:",
                new Date(metadata.exportDate).toLocaleString("th-TH"),
            ]);
        }
        if (metadata.exportBy) {
            exportData.push(["ผู้ส่งออก:", metadata.exportBy]);
        }
        if (metadata.filters && Object.keys(metadata.filters).length > 0) {
            exportData.push(["ตัวกรอง:"]);
            Object.entries(metadata.filters).forEach(([key, value]) => {
                if (value) {
                    exportData.push([`  ${key}:`, value]);
                }
            });
        }
        exportData.push([]);
    }

    // Add headers
    exportData.push(columns.map((col) => col.header));

    // Add data rows
    data.forEach((row) => {
        const rowData = columns.map((col) => {
            const value = row[col.key];
            // Format dates
            if (value instanceof Date) {
                return value.toLocaleDateString("th-TH");
            }
            return value ?? "";
        });
        exportData.push(rowData);
    });

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(exportData);

    // Set column widths
    const colWidths = columns.map((col) => ({
        wch: col.width || 15,
    }));
    ws["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate and download file
    XLSX.writeFile(wb, `${filename}.xlsx`);
}

// Specific export functions for different reports

export function exportStockBalanceToExcel(
    data: any[],
    filters?: { whCode?: string; productCode?: string }
) {
    exportToExcel({
        filename: `stock-balance-${new Date().toISOString().split("T")[0]}`,
        sheetName: "Stock Balance",
        columns: [
            { header: "รหัสสินค้า", key: "productCode", width: 15 },
            { header: "ชื่อสินค้า", key: "productName", width: 30 },
            { header: "รหัสคลัง", key: "whCode", width: 12 },
            { header: "ชื่อคลัง", key: "whName", width: 25 },
            { header: "ยอดคงเหลือ", key: "balance", width: 15 },
            { header: "หน่วย", key: "uomCode", width: 10 },
        ],
        data,
        metadata: {
            title: "รายงานยอดคงคลัง (Stock Balance)",
            exportDate: new Date(),
            filters: {
                "คลังสินค้า": filters?.whCode || "ทั้งหมด",
                "รหัสสินค้า": filters?.productCode || "ทั้งหมด",
            },
        },
    });
}

export function exportStockMovementToExcel(
    data: any[],
    filters?: {
        startDate?: string;
        endDate?: string;
        productCode?: string;
        whCode?: string;
    }
) {
    exportToExcel({
        filename: `stock-movement-${new Date().toISOString().split("T")[0]}`,
        sheetName: "Stock Movement",
        columns: [
            { header: "วันที่", key: "docDate", width: 15 },
            { header: "เลขที่เอกสาร", key: "docNo", width: 20 },
            { header: "ประเภท", key: "docTypeName", width: 20 },
            { header: "รหัสสินค้า", key: "productCode", width: 15 },
            { header: "ชื่อสินค้า", key: "productName", width: 30 },
            { header: "คลัง", key: "whCode", width: 12 },
            { header: "จำนวน", key: "qty", width: 12 },
            { header: "หน่วย", key: "uomCode", width: 10 },
            { header: "หมายเหตุ", key: "remark", width: 25 },
        ],
        data,
        metadata: {
            title: "รายงานความเคลื่อนไหวสินค้า (Stock Movement)",
            exportDate: new Date(),
            filters: {
                "วันที่เริ่มต้น": filters?.startDate || "-",
                "วันที่สิ้นสุด": filters?.endDate || "-",
                "รหัสสินค้า": filters?.productCode || "ทั้งหมด",
                "คลังสินค้า": filters?.whCode || "ทั้งหมด",
            },
        },
    });
}

export function exportStockCardToExcel(
    data: any[],
    filters?: {
        productCode?: string;
        whCode?: string;
        startDate?: string;
        endDate?: string;
    }
) {
    exportToExcel({
        filename: `stock-card-${new Date().toISOString().split("T")[0]}`,
        sheetName: "Stock Card",
        columns: [
            { header: "วันที่", key: "docDate", width: 15 },
            { header: "เลขที่เอกสาร", key: "docNo", width: 20 },
            { header: "รหัสสินค้า", key: "productCode", width: 15 },
            { header: "ชื่อสินค้า", key: "productName", width: 30 },
            { header: "คลัง", key: "whName", width: 20 },
            { header: "วันผลิต", key: "mfgDate", width: 15 },
            { header: "วันหมดอายุ", key: "expDate", width: 15 },
            { header: "รับเข้า", key: "inQty", width: 12 },
            { header: "จ่ายออก", key: "outQty", width: 12 },
            { header: "คงเหลือ", key: "balance", width: 12 },
        ],
        data,
        metadata: {
            title: "รายงานสต็อกการ์ด (Stock Card)",
            exportDate: new Date(),
            filters: {
                "รหัสสินค้า": filters?.productCode || "ทั้งหมด",
                "คลังสินค้า": filters?.whCode || "ทั้งหมด",
                "วันที่เริ่มต้น": filters?.startDate || "-",
                "วันที่สิ้นสุด": filters?.endDate || "-",
            },
        },
    });
}
