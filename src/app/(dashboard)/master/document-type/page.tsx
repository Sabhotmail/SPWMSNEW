import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DocumentTypeClient } from "./document-type-client";

export default async function DocumentTypePage() {
    const session = await auth();

    // Only admin (role >= 7) can access Master Data
    if (!session?.user || session.user.role < 7) {
        redirect("/dashboard?error=unauthorized");
    }

    return <DocumentTypeClient />;
}
