import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { serializeForJSON } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "activity"; // activity | stock
        const limit = parseInt(searchParams.get("limit") || "100");
        const module = searchParams.get("module");
        const docNo = searchParams.get("docNo");

        if (type === "stock") {
            const where: any = {};
            if (docNo) where.docNo = docNo;

            const logs = await prisma.stockLog.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take: limit,
            });
            return NextResponse.json(serializeForJSON(logs));
        } else {
            const where: any = {};
            if (module) where.module = module;
            if (docNo) where.docNo = docNo;

            const logs = await prisma.activityLog.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take: limit,
            });
            return NextResponse.json(serializeForJSON(logs));
        }
    } catch (error) {
        console.error("Get logs error:", error);
        return NextResponse.json(
            { error: "Failed to get logs" },
            { status: 500 }
        );
    }
}
