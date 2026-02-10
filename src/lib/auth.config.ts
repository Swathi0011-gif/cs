import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isAuthRoute = nextUrl.pathname === "/login" || nextUrl.pathname === "/signup";
            const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard") || nextUrl.pathname.startsWith("/admin");

            if (isAuthRoute) {
                if (isLoggedIn) {
                    return Response.redirect(new URL("/dashboard", nextUrl));
                }
                return true;
            }

            if (isDashboardRoute) {
                if (isLoggedIn) return true;
                return false; // Redirect to login
            }

            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.id = user.id as string;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        },
    },
    providers: [], // Add providers with server-side logic in auth.ts
} satisfies NextAuthConfig;
