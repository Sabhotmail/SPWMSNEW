/** Numeric role level (session uses number; DB may store string). */
export function roleLevel(role: number | string | null | undefined): number {
  if (role === null || role === undefined) return 0;
  if (typeof role === "number") return Number.isFinite(role) ? role : 0;
  const trimmed = String(role).trim().toUpperCase();
  if (trimmed === "ITADMIN") return 9;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : 0;
}

/** Legacy: IN/OUT (and GR/GI) ≥5; TRN/ADJ (and TF) ≥7. */
export function canApproveDoctype(
  role: number | string | null | undefined,
  docTypeCode: string
) {
  const level = roleLevel(role);
  const code = String(docTypeCode || "").toUpperCase();
  if (code === "TRN" || code === "TF" || code === "ADJ") return level >= 7;
  return level >= 5;
}

export function canCancelDoctype(
  role: number | string | null | undefined,
  docTypeCode: string
) {
  // Same gate as approve for parity with warehouse workflow
  return canApproveDoctype(role, docTypeCode);
}

export function roleLabel(role: number | string | null | undefined) {
  switch (String(roleLevel(role))) {
    case "1":
    case "5":
      return "พนักงานคลังสินค้า";
    case "3":
      return "ผู้ใช้งาน";
    case "6":
      return "ผู้ช่วยหัวหน้าคลังสินค้า";
    case "7":
      return "หัวหน้าคลังสินค้า";
    case "8":
      return "SPOC";
    case "9":
      return "ITADMIN";
    default:
      return "ไม่ทราบสิทธิ์";
  }
}
