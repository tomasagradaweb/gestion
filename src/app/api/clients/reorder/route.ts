//src/app/api/clients/reorder/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// POST - Reordenar clientes
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { business: true },
    })

    if (!user?.business?.id) {
      return NextResponse.json({ error: "No se encontró un negocio asociado" }, { status: 404 })
    }

    const data = await req.json()

    if (!Array.isArray(data.ids)) {
      return NextResponse.json({ error: "Se requiere un array de IDs" }, { status: 400 })
    }

    const clients = await prisma.client.findMany({
      where: {
        id: { in: data.ids },
        businessId: user.business.id,
      },
      select: { id: true },
    })

    if (clients.length !== data.ids.length) {
      return NextResponse.json(
        {
          error: "Algunos clientes no existen o no pertenecen a tu negocio",
        },
        { status: 400 },
      )
    }

    await prisma.$transaction(
      data.ids.map((id: string, index: number) =>
        prisma.client.update({
          where: { id },
          data: { posicion: index },
        }),
      ),
    )

    return NextResponse.json({
      message: "Clientes reordenados correctamente",
    })
  } catch (error) {
    console.error("Error al reordenar clientes:", error)
    return NextResponse.json({ error: "Error al reordenar los clientes" }, { status: 500 })
  }
}