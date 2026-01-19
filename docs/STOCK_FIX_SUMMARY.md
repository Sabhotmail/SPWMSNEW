# Stock Movement Report Fix - Task Summary

## 📋 Problem Description
A discrepancy was found in the Opening Balance for product `1010010001` in warehouse `42G1`:
- **Legacy System:** 39 Cartons
- **New System:** -21 Cartons
- **Difference:** 60 Cartons (4,320 pieces)

## 🔍 Investigation Findings
1.  **Missing Initial Stock:** The legacy system has a "Brought Forward" (BF) value of 39 cartons at 2024-12-31. However, summing up all ledger transactions in both the legacy and new systems only yields -21 cartons. This confirms that 60 cartons were added as an "initial balance" in the old system without a corresponding transaction record that was migrated.
2.  **Calculation Logic:** The initial `getOpeningBalance` logic only checked the `whCode` field, missing transactions where the warehouse was specified in `toWhCode` (common for Adjustments and Transfers).

## ✅ Improvements Made
1.  **Enhanced `page.tsx`:**
    -   Updated `getOpeningBalance` and `getStockLedger` to check both `whCode` and `toWhCode`.
    -   Revised the ledger mapping logic to correctly determine IN/OUT direction based on the selected warehouse and the document's `movementType`.
    -   Added "Mixed Units" display (Carton-Pack-Piece) for better readability.
2.  **Bug Fixes:** Resolved Lint errors regarding missing properties `inQty` and `outQty` in the ledger data structure.

## 🛠️ Remaining Actions (Required to fix the -21 vs 39 issue)
To align the new system with the legacy balance, a manual "Beginning Balance" (BEG) entry of **60 Cartons (4,320 pieces)** must be created.

### Recommended Fix Script (`fix-missing-opening.js`):
The previous attempts to create this record failed due to Prisma schema requirements (mandatory relations). The next agent should use a script that connects all required relations:

```javascript
// Example correct logic for creating the missing entry
await prisma.transactionHeader.create({
    data: {
        docNo: "BEG-MANUAL-001",
        docDate: new Date('2023-12-31T00:00:00Z'),
        postDate: new Date('2023-12-31T00:00:00Z'),
        toWhCode: "42G1",
        docStatus: 'APPROVED',
        docState: 'CLOSED',
        // Must connect these relations based on the specific schema:
        documentType: { connect: { docTypeCode: 'BEG' } },
        createdByUser: { connect: { userId: 'ITADMIN' } },
        approvedByUser: { connect: { userId: 'ITADMIN' } },
        // If 'warehouse' relation is mandatory for whCode/toWhCode, connect it:
        // warehouse: { connect: { whCode: '42G1' } }, 
        details: {
            create: {
                lineNo: 1,
                productCode: "1010010001",
                uomCode: 'PCS',
                pieceQty: 4320,
                mfgDate: new Date('2023-12-31T00:00:00Z'),
            }
        }
    }
});
```

## 📂 Current Progress Files
- `src/app/(dashboard)/reports/stock-movement/page.tsx`: Core report logic (Updated).
- `fix-missing-opening.js`: Draft script for adding the missing 60 cartons.
- `check-legacy-transaction-sum.js`: Audit script that proved the transaction deficit.
- `check-legacy-bf-data.js`: Proved the legacy system has a seed balance.
