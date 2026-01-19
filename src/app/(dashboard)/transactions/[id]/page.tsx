import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { TransactionViewClient } from "./transaction-view-client";
import { serializeForJSON } from "@/lib/serialize";

// Fetch transaction detail with warehouse relation
async function getTransaction(id: number) {
    const tx = await prisma.transactionHeader.findUnique({
        where: { id },
        include: {
            documentType: true,
            createdByUser: { select: { username: true } },
            details: {
                include: { product: true },
            },
        },
    });

    if (tx && (tx as any).whCode) {
        // Fetch warehouse separately as a workaround for locked Prisma client
        (tx as any).warehouse = await prisma.warehouse.findUnique({
            where: { whCode: (tx as any).whCode }
        });
        if ((tx as any).toWhCode) {
            (tx as any).toWarehouse = await prisma.warehouse.findUnique({
                where: { whCode: (tx as any).toWhCode }
            });
        }
    }

    return tx;
}

export default async function TransactionDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    const { id } = await params;
    const transaction = await getTransaction(parseInt(id));

    if (!transaction) {
        notFound();
    }

    // Serialize the transaction to handle Decimal types
    const serializedTransaction = serializeForJSON(transaction);

    const products = await prisma.product.findMany({
        orderBy: { productCode: 'asc' }
    });

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <TransactionViewClient
                transaction={serializedTransaction as any}
                userRole={session?.user?.role || 1}
                products={serializeForJSON(products) as any}
            />
        </div>
    );
}
