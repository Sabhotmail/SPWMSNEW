import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { UsersClient } from "./users-client";

async function getUsers() {
    return prisma.user.findMany({
        select: {
            id: true,
            userId: true,
            username: true,
            email: true,
            role: true,
            branchCode: true,
            status: true,
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
    });
}

async function getBranches() {
    return prisma.branch.findMany({
        where: { status: "ACTIVE" },
        orderBy: { branchName: "asc" },
    });
}

export default async function UsersPage() {
    const session = await auth();

    // Only admin can access
    if (!session || session.user.role < 7) {
        redirect("/dashboard");
    }

    const [users, branches] = await Promise.all([
        getUsers(),
        getBranches(),
    ]);

    return <UsersClient initialUsers={users} branches={branches} />;
}
