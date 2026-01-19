import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { WarehousesClient } from "./warehouses-client";

async function getWarehouses() {
    return prisma.warehouse.findMany({
        where: { status: "ACTIVE" },
        include: {
            locations: {
                where: { status: "ACTIVE" },
                orderBy: { locCode: "asc" },
            },
            _count: {
                select: { stocks: true },
            },
        },
        orderBy: { whCode: "asc" },
    });
}

async function getBranches() {
    return prisma.branch.findMany({
        where: { status: "ACTIVE" },
        orderBy: { branchName: "asc" },
    });
}

export default async function WarehousesPage() {
    const session = await auth();

    // Only admin (role >= 7) can access Master Data
    if (!session?.user || session.user.role < 7) {
        redirect("/dashboard?error=unauthorized");
    }

    const [warehouses, branches] = await Promise.all([
        getWarehouses(),
        getBranches(),
    ]);

    return (
        <WarehousesClient
            initialWarehouses={warehouses}
            branches={branches}
            userRole={session?.user?.role || 1}
        />
    );
}
