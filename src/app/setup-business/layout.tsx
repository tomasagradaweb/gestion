import type React from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function SetupBusinessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Si no hay sesión, redirigir al login
  if (!session) {
    redirect("/login")
  }

  try {
    // Verificamos si el usuario ya tiene un Business asociado usando API nativa de Prisma
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        businessId: true,
      },
    })

    // Si el usuario tiene un businessId, redirigir al dashboard
    if (user?.businessId) {
      redirect("/dashboard")
    }
  } catch (error) {
    console.error("Error verificando Business:", error)
    // En caso de error, continuamos con el flujo normal
    // Si hay un error grave, probablemente se manifestará en otras partes de la aplicación
  }

  return <>{children}</>
}