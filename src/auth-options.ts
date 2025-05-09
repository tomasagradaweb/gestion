// src/auth-options.ts
import GitHubProvider from "next-auth/providers/github"
import type { DefaultSession, NextAuthConfig } from "next-auth"

// Extendemos DefaultSession para incluir user.id
// En auth-options.ts, modifica la declaración para incluir role
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
    } & DefaultSession["user"]
  }
}

// Configuración base sin PrismaAdapter para usar en middleware
export const authOptions: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt" as const,
    maxAge: 60 * 60 * 24 * 30, // 30 días
  },
  providers: [
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID || "",
      clientSecret: process.env.AUTH_GITHUB_SECRET || "",
      usePKCE: false,
    } as any),
    // Solo definimos los providers, sin la lógica de autorización
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Aseguramos redirección al dashboard
      if (url.startsWith(baseUrl) || url.startsWith("/api/auth")) {
        return `${baseUrl}/dashboard`;
      }
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
  },
}