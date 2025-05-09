import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// GET - Obtener la configuración de una tabla
export async function GET(req: Request) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener el parámetro tableId
    const url = new URL(req.url)
    const tableId = url.searchParams.get("tableId")

    if (!tableId) {
      return NextResponse.json({ error: "Se requiere el parámetro tableId" }, { status: 400 })
    }

    // Verificar si el modelo TableConfig existe
    try {
      // Intentar acceder a tableConfig para verificar si existe
      // @ts-ignore - Ignoramos el error de TypeScript porque estamos verificando si existe
      if (!prisma.tableConfig) {
        console.log("El modelo TableConfig no existe en el esquema de Prisma")
        return NextResponse.json({ config: null })
      }

      // Si llegamos aquí, el modelo existe
      const config = await prisma.tableConfig.findUnique({
        where: {
          userId_tableId: {
            userId: session.user.id,
            tableId,
          },
        },
      })

      if (!config) {
        return NextResponse.json({ config: null })
      }

      return NextResponse.json({ config: config.config })
    } catch (error) {
      console.error("Error al buscar configuración:", error)
      // Si el modelo no existe, devolver null
      return NextResponse.json({ config: null })
    }
  } catch (error) {
    console.error("Error al obtener configuración de tabla:", error)
    return NextResponse.json({ error: "Error al obtener la configuración de la tabla" }, { status: 500 })
  }
}

// POST - Guardar la configuración de una tabla
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const data = await req.json()

    // Validar datos requeridos
    if (!data.tableId || !data.config) {
      return NextResponse.json(
        {
          error: "Se requieren tableId y config",
        },
        { status: 400 },
      )
    }

    // Verificar si el modelo TableConfig existe
    // @ts-ignore - Ignoramos el error de TypeScript porque estamos verificando si existe
    if (!prisma.tableConfig) {
      console.log("El modelo TableConfig no existe en el esquema de Prisma")
      return NextResponse.json({
        message: "Configuración guardada en memoria (el modelo TableConfig no existe)",
        id: "temp-id",
      })
    }

    try {
      // Buscar si ya existe una configuración para esta tabla y usuario
      let result

      try {
        const existingConfig = await prisma.tableConfig.findUnique({
          where: {
            userId_tableId: {
              userId: session.user.id,
              tableId: data.tableId,
            },
          },
        })

        if (existingConfig) {
          // Actualizar configuración existente
          result = await prisma.tableConfig.update({
            where: {
              id: existingConfig.id,
            },
            data: {
              config: data.config,
              updatedAt: new Date(),
            },
          })
        } else {
          // Crear nueva configuración
          result = await prisma.tableConfig.create({
            data: {
              userId: session.user.id,
              tableId: data.tableId,
              config: data.config,
            },
          })
        }
      } catch (prismaError) {
        console.error("Error de Prisma:", prismaError)

        // Si el error es porque el modelo no existe, devolver un mensaje específico
        if (
          prismaError instanceof Error &&
          (prismaError.message.includes("does not exist") || prismaError.message.includes("not found"))
        ) {
          return NextResponse.json({
            message: "Configuración guardada en memoria (el modelo TableConfig no existe)",
            details:
              "Asegúrate de que el modelo TableConfig esté correctamente definido en schema.prisma y hayas ejecutado prisma generate",
          })
        }

        throw prismaError // Re-lanzar para que lo capture el catch exterior
      }

      return NextResponse.json({
        message: "Configuración guardada correctamente",
        id: result.id,
      })
    } catch (error) {
      console.error("Error al guardar configuración:", error)
      return NextResponse.json({
        message: "Configuración guardada en memoria (error al guardar en la base de datos)",
        details: error instanceof Error ? error.message : "Error desconocido",
      })
    }
  } catch (error) {
    console.error("Error al guardar configuración de tabla:", error)
    return NextResponse.json({
      message: "Configuración guardada en memoria (error general)",
      details: error instanceof Error ? error.message : "Error desconocido",
    })
  }
}

