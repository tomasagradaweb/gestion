// src/auth.ts
import NextAuth from "next-auth"
import GitHubProvider from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"  
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"  
import type { JWT } from "next-auth/jwt"
import type { Session, User, DefaultSession } from "next-auth"

// Ampliar la sesión para incluir información adicional
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role?: string
    } & DefaultSession["user"]
  }
  
  interface User {
    role?: string
  }
}

// Ampliar JWT para incluir información adicional
declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role?: string
  }
}

const domain =
  process.env.NODE_ENV === "production"
    ? new URL(process.env.NEXTAUTH_URL!).hostname
    : undefined;

const config = {
  providers: [
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID ?? "",
      clientSecret: process.env.AUTH_GITHUB_SECRET ?? "",
      profile(profile: any) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          // Puedes agregar roles predeterminados para usuarios OAuth
          role: "user", 
        }
      },
      usePKCE: false,
    } as any),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email y contraseña requeridos.")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          select: {
            id: true,
            email: true,
            name: true,
            hashedPassword: true,
            role: true,
            image: true,
          },
        })

        if (!user) {
          throw new Error("Usuario no encontrado.")
        }

        if (!user.hashedPassword) {
          throw new Error("Este usuario no tiene contraseña configurada.")
        }

        const isValid = await bcrypt.compare(credentials.password as string, user.hashedPassword)
        if (!isValid) {
          throw new Error("Credenciales inválidas.")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role || "user",
        }
      },
    }),
    Google,
  ],
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax" as "lax",
        path: "/",
        secure: true,
        domain: domain,
      },
    },
  },
  callbacks: {
    async jwt({ token, user, account, profile }: { token: JWT; user?: User; account?: any; profile?: any }) {
      // Transferir datos del usuario al token JWT en el inicio de sesión
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      
      // Puedes realizar validaciones adicionales en cada solicitud
      return token
    },
    
    async session({ session, token }: { session: Session; token: JWT }) {
      // Transferir datos del token a la sesión
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
    
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Estrategia de redirección mejorada
      console.log("Redirect callback:", { url, baseUrl })
      
      // Si la URL es la del callback de un proveedor, redireccionar al dashboard
      if (url.includes("/api/auth/callback/")) {
        return `${baseUrl}/dashboard`
      }
      
      // URLs relativas
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      }
      
      // URLs absolutas dentro de nuestro dominio
      if (url.startsWith(baseUrl)) {
        return url
      }
      
      // Por defecto, redireccionar al dashboard
      return `${baseUrl}/dashboard`
    },
  },
  secret: process.env.AUTH_SECRET ?? "", // Cambiado || a ?? para manejar undefined
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  pages: {
    signIn: "/login",
    error: "/login", // Página de error
    signOut: "/login", // Redirigir después de cerrar sesión
  },
  // Configuración de adaptador para persistencia de usuarios
  adapter: PrismaAdapter(prisma),
  // Configuración de debug
  debug: process.env.NODE_ENV === "development",
}

export const { auth, handlers, signIn, signOut } = NextAuth(config)