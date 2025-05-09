// src/types/next-auth.d.ts
import type { DefaultSession } from "next-auth"

// Define el tipo para el negocio
type Business = {
  id: string
  name: string
  status?: string
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role?: string
      business?: Business
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role?: string
    businessId?: string
    business?: Business
  }
}

