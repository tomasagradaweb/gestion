import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ hasBusiness: false, error: "No autorizado" }, { status: 401 })
    }

    const result = await prisma.$queryRaw`
      SELECT b.id 
      FROM "User" u 
      LEFT JOIN "Business" b ON u."businessId" = b.id 
      WHERE u.id = ${session.user.id}
    `

    const hasBusiness = Array.isArray(result) && result.length > 0 && result[0]?.id

    return NextResponse.json({ hasBusiness: !!hasBusiness })
  } catch (error) {
    console.error("Error verificando Business:", error)
    return NextResponse.json({ hasBusiness: false, error: "Error al verificar Business" }, { status: 500 })
  }
}

