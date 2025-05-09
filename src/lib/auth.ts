// src/lib/auth.ts - Funciones auxiliares para autenticación
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export async function requireAuth() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }
  
  return session
}

export async function requireAdmin() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }
  
  if (session.user.role !== "admin") {
    redirect("/dashboard")
  }
  
  return session
}