import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TransactionForm } from "../../components/transaction-form";
import { serializeForJSON } from "@/lib/serialize";

async function getWarehouses() {
    return prisma.warehouse.findMany({
        where: { status: "ACTIVE" },
        orderBy: { whCode: "asc" }
    });
}

async function getProducts() {
    return prisma.product.findMany({
        where: { status: "ACTIVE" },
        orderBy: { productCode: "asc" }
    });
}

export default async function NewTransferPage() {
    await auth();
    const [warehouses, products] = await Promise.all([
        getWarehouses(),
        getProducts()
    ]);

    return (
        <div className="p-6">
            <TransactionForm
                type="TRN"
                warehouses={serializeForJSON(warehouses)}
                products={serializeForJSON(products)}
                backUrl="/transactions/transfer"
                headerOnly={true}
            />
        </div>
    );
}
