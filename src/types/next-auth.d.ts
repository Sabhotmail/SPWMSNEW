import "next-auth";

declare module "next-auth" {
    interface User {
        id: string;
        role: number;
        branchCode: string;
        userId: string;
    }

    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            role: number;
            branchCode: string;
            userId: string;
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: number;
        branchCode: string;
        userId: string;
    }
}
