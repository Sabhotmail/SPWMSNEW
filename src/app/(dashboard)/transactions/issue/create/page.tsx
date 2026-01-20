import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TransactionForm } from "../../components/transaction-form";
import { serializeForJSON } from "@/lib/serialize";

async function getWarehouses() {
    return prisma.warehouse.findMany({
        where: { status: "ACTIVE" },
    });
}

async function getProducts() {
    return prisma.product.findMany({
        where: { status: "ACTIVE" },
    });
}

export default async function CreateIssuePage() {
    await auth();

    const [warehouses, products] = await Promise.all([
        getWarehouses(),
        getProducts(),
    ]);

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <TransactionForm
                type="OUT"
                warehouses={serializeForJSON(warehouses)}
                products={serializeForJSON(products)}
                backUrl="/transactions/issue"
                headerOnly={false}
            />
        </div>
    );
}
