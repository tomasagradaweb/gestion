import type React from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Si no hay sesión, redirigir al login
  if (!session) {
    redirect("/login")
  }

  let hasBusinessAssociated = false

  try {
    const result = await prisma.$queryRaw`
      SELECT u.id, b.id as "businessId" 
      FROM "User" u 
      LEFT JOIN "Business" b ON u."businessId" = b.id 
      WHERE u.id = ${session.user.id}
    `

    const user = Array.isArray(result) && result.length > 0 ? result[0] : null
    hasBusinessAssociated = !!user?.businessId
  } catch (error) {
    console.error("Error verificando Business:", error)
    hasBusinessAssociated = false
  }

  if (!hasBusinessAssociated) {
    redirect("/setup-business")
  }

  return <>{children}</>
}

