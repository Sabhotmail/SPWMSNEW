# Database Comparison: Old System vs New System

## สรุปตาราง

| ตาราง (Old) | ระบบใหม่ | สถานะ | หมายเหตุ |
|-------------|----------|-------|----------|
| users | ✅ มี | OK | |
| branches | ✅ มี | OK | |
| warehouses | ✅ มี | ⚠️ ขาด palletcapacity, casecapacity, seq |
| locations | ✅ มี | ⚠️ ขาด palletcapacity, casecapacity |
| principals | ✅ มี | OK | |
| brands | ✅ มี | OK | |
| uoms | ✅ มี | OK | |
| products | ✅ มี | ⚠️ ขาดหลาย fields (barcodes, shelflife, etc.) |
| productuoms | ✅ มี | ⚠️ ขาด startdate, enddate |
| documenttypes | ✅ มี | ⚠️ ขาด docprefix, yeardigit, runningdigit |
| documentnumbers | ✅ มี | OK | |
| movementtypes | ✅ มี | OK | |
| transaction_headers | ✅ มี | ⚠️ ขาด ref1-3, salesmancode, movementtypecode |
| transaction_details | ✅ มี | ⚠️ ขาด pieceqty, uomratio, movementtypecode |
| stocks | ✅ มี | ⚠️ ขาด futureinbal, futureoutbal, dates |
| stockdates | ✅ มี | ⚠️ ขาดหลาย fields |
| stocklogs | ❌ ไม่มี | ⚠️ ต้องเพิ่ม |
| transacdetaillogs | ❌ ไม่มี | ⚠️ ต้องเพิ่ม |
| approvedlogs | ❌ ไม่มี | ⚠️ ต้องเพิ่ม |
| salesmans | ❌ ไม่มี | ⚠️ ต้องเพิ่ม |
| baskets | ✅ มี (Model) | ไม่ใช้ | |
| debuglogs | ❌ ไม่มี | ไม่จำเป็น | |
| reports | ❌ ไม่มี | ไม่จำเป็น | |
| *_semaphores | ❌ ไม่มี | ไม่จำเป็น | |

---

## ⚠️ Fields ที่ขาดในตารางหลัก

### products
- piecebarcode, packbarcode, innerbarcode, casebarcode
- imgpath
- shelflife, reorderpoint
- slowmovingday, mediummovingday, fastmovingday
- allowpartialin, allowpartialout
- caseweight, casewidth, caselength, caseheight, casevolume
- stockcontrol, maxmfgdays, allowmaxmfgdays, offsetdays

### productuoms
- startdate, enddate

### documenttypes
- docprefix, yeardigit, runningdigit

### transaction_headers
- ref1, ref2, ref3
- salesmancode
- movementtypecode
- loccode (เฉพาะ header)

### transaction_details
- pieceqty
- uomratio
- movementtypecode
- recordtype

### stocks
- futureinbal, futureoutbal
- firstindate, lastindate
- firstoutdate, lastoutdate
- lastmovedate

### stockdates
- futureinbal, futureoutbal
- firstindate, lastindate
- firstoutdate, lastoutdate
- lastmovedate

---

## ❌ ตารางที่ต้องเพิ่ม

1. **stocklogs** - Log การเปลี่ยนแปลงสต็อก
2. **transacdetaillogs** - Log รายละเอียดธุรกรรม
3. **approvedlogs** - Log การอนุมัติ
4. **salesmans** - ข้อมูลพนักงานขาย (ถ้าใช้)

---

## 🎯 ลำดับความสำคัญ

### สูง (ควรทำก่อน)
1. เพิ่ม fields ใน products (barcodes, shelflife)
2. เพิ่ม fields ใน stocks/stockdates (future balances)
3. เพิ่ม stocklogs table

### กลาง
4. เพิ่ม fields ใน documenttypes (prefix, digits)
5. เพิ่ม fields ใน transaction_headers/details

### ต่ำ
6. เพิ่ม salesmans table
7. เพิ่ม approvedlogs, transacdetaillogs
