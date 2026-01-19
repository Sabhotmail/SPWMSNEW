import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
    userId: z.string().min(1),
    password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                userId: { label: "User ID", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const parsed = loginSchema.safeParse(credentials);
                if (!parsed.success) return null;

                const { userId, password } = parsed.data;

                const user = await prisma.user.findUnique({
                    where: {
                        userId: userId.toUpperCase(),
                        status: "ACTIVE"
                    },
                });

                if (!user) return null;

                const isValidPassword = await bcrypt.compare(password, user.password);
                if (!isValidPassword) return null;

                return {
                    id: user.id.toString(),
                    name: user.username,
                    email: user.email,
                    role: user.role,
                    branchCode: user.branchCode || "",
                    userId: user.userId,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as { role: number }).role;
                token.branchCode = (user as { branchCode: string }).branchCode;
                token.userId = (user as { userId: string }).userId;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as number;
                session.user.branchCode = token.branchCode as string;
                session.user.userId = token.userId as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
});
