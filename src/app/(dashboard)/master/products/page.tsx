import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProductsClient } from "./products-client";
import { serializeForJSON } from "@/lib/serialize";

async function getProducts() {
    const products = await prisma.product.findMany({
        where: { status: "ACTIVE" },
        include: {
            principal: true,
            brand: true,
        },
        orderBy: { productCode: "asc" },
        take: 1000,
    });
    return products;
}

async function getPrincipals() {
    return prisma.principal.findMany({
        where: { status: "ACTIVE" },
        orderBy: { principalName: "asc" },
    });
}

async function getBrands() {
    return prisma.brand.findMany({
        where: { status: "ACTIVE" },
        orderBy: { brandName: "asc" },
    });
}

async function getUOMs() {
    return prisma.uOM.findMany({
        where: { status: "ACTIVE" },
        orderBy: { uomName: "asc" },
    });
}

export default async function ProductsPage() {
    const session = await auth();

    // Only admin (role >= 7) can access Master Data
    if (!session?.user || session.user.role < 7) {
        redirect("/dashboard?error=unauthorized");
    }

    const [products, principals, brands, uoms] = await Promise.all([
        getProducts(),
        getPrincipals(),
        getBrands(),
        getUOMs(),
    ]);

    return (
        <ProductsClient
            initialProducts={serializeForJSON(products) as any}
            principals={serializeForJSON(principals) as any}
            brands={serializeForJSON(brands) as any}
            uoms={serializeForJSON(uoms) as any}
            userRole={session?.user?.role || 1}
        />
    );
}
