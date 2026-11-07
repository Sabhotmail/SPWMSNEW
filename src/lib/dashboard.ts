import { prisma } from "@/lib/prisma";

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function monthRange() {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return { fromdate: ymd(from), todate: ymd(now) };
}

export function todayRange() {
  const t = ymd(new Date());
  return { fromdate: t, todate: t };
}

export async function dashboardByPostdate(fromdate: string, todate: string) {
  const rows = await prisma.$queryRaw<
    Array<{ doc_status: string; c: number }>
  >`
    SELECT doc_status, COUNT(*)::int AS c
    FROM transaction_headers
    WHERE CAST(post_date AS date) BETWEEN CAST(${fromdate} AS date) AND CAST(${todate} AS date)
    GROUP BY doc_status
  `;

  const counts = {
    DRAFT: 0,
    APPROVED: 0,
    CANCELLED: 0,
    OTHER: 0,
  };
  let total = 0;
  for (const row of rows) {
    total += row.c;
    if (row.doc_status === "DRAFT") counts.DRAFT = row.c;
    else if (row.doc_status === "APPROVED") counts.APPROVED = row.c;
    else if (row.doc_status === "CANCELLED") counts.CANCELLED = row.c;
    else counts.OTHER += row.c;
  }

  return { fromdate, todate, counts, total };
}
