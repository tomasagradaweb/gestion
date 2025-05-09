import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { PrismaClient } from "@prisma/client"
import { validateBusiness } from "@/lib/validations/business"

const prisma = new PrismaClient()

// Añadimos el método GET para obtener el negocio actual
export async function GET() {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Buscar el usuario con su negocio asociado
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { business: true },
    })

    if (!user || !user.business) {
      return NextResponse.json({ business: null }, { status: 200 })
    }

    // Devolver solo la información necesaria del negocio
    return NextResponse.json({
      business: {
        id: user.business.id,
        name: user.business.name,
        status: user.business.status,
      },
    })
  } catch (error) {
    console.error("Error al obtener el negocio:", error)
    return NextResponse.json({ error: "Error al obtener información del negocio" }, { status: 500 })
  }
}

// Tu método POST existente se mantiene igual
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const data = await req.json()

    // Validar datos con nuestra función completa de validación
    const validationResult = await validateBusiness(data, prisma)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: validationResult.error,
          details: validationResult.details,
        },
        { status: 400 },
      )
    }

    try {
      // Crear el negocio usando Prisma ORM con los datos validados
      const business = await prisma.business.create({
        data: {
          ...validationResult.data,
          name: validationResult.data.name ?? "Default Name", // Ensure 'name' is explicitly included
          status: "active",
          users: {
            connect: {
              id: session.user.id,
            },
          },
        },
      })

      // Actualizar el usuario con el businessId
      await prisma.user.update({
        where: { id: session.user.id },
        data: { businessId: business.id },
      })

      return NextResponse.json({
        id: business.id,
        name: business.name,
        message: "Negocio creado correctamente",
      })
    } catch (dbError: any) {
      console.error("Error en la base de datos:", dbError)

      // Manejar error de unicidad de taxId
      if (dbError.code === "P2002" && dbError.meta?.target?.includes("taxId")) {
        return NextResponse.json(
          {
            error: "Ya existe un negocio con este CIF/NIF",
          },
          { status: 409 },
        )
      }

      // Proporcionar mensajes de error más específicos basados en el tipo de error
      const errorMessage = dbError instanceof Error ? dbError.message : "Error desconocido"

      if (errorMessage.includes("Foreign key constraint failed")) {
        return NextResponse.json({ error: "Error de relación: No se pudo vincular con el usuario" }, { status: 400 })
      }

      if (errorMessage.includes("Unique constraint failed")) {
        return NextResponse.json({ error: "Ya existe un negocio con esos datos" }, { status: 400 })
      }

      // Verificar si el error es porque el modelo Business no existe
      if (errorMessage.includes("doesn't exist") || errorMessage.includes("not found")) {
        return NextResponse.json(
          {
            error: "El modelo Business no está definido en el esquema de Prisma",
            details:
              "Asegúrate de que el modelo Business esté correctamente definido en schema.prisma y hayas ejecutado prisma generate",
          },
          { status: 500 },
        )
      }

      return NextResponse.json(
        {
          error: "Error al crear el negocio en la base de datos",
          details: errorMessage,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error al crear negocio:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear el negocio" },
      { status: 500 },
    )
  }
}

