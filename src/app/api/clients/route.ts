// src/app/api/clients/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { validateClient } from "@/lib/validations/client"
import { Prisma } from "@prisma/client"

// GET - Obtener todos los clientes del negocio actual
export async function GET(req: Request) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener el usuario con su negocio asociado
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { business: true },
    })

    if (!user?.business?.id) {
      return NextResponse.json({ error: "No se encontró un negocio asociado" }, { status: 404 })
    }

    // Obtener parámetros de consulta
    const url = new URL(req.url)
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const search = url.searchParams.get("search") || ""
    const tipoCliente = url.searchParams.get("tipoCliente") || ""

    // Calcular offset para paginación
    const skip = (page - 1) * limit

    // Construir condiciones de búsqueda
    let searchCondition: Prisma.ClientWhereInput = {}

    if (search) {
      searchCondition = {
        OR: [
          { nombre: { contains: search, mode: "insensitive" } },
          { nombreComercial: { contains: search, mode: "insensitive" } },
          { nifContacto: { contains: search, mode: "insensitive" } },
          { identificacionVAT: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { telefono: { contains: search, mode: "insensitive" } },
          { movil: { contains: search, mode: "insensitive" } },
          { poblacion: { contains: search, mode: "insensitive" } },
          { provincia: { contains: search, mode: "insensitive" } },
          { metadatos: { contains: search, mode: "insensitive" } },
        ],
      }
    }

    // Filtro por tipo de cliente
    let tipoClienteCondition: Prisma.ClientWhereInput = {}
    if (tipoCliente) {
      tipoClienteCondition = {
        metadatos: {
          contains: `"tipoCliente":"${tipoCliente}"`,
          mode: "insensitive",
        },
      }
    }

    // Combinar condiciones
    const whereCondition: Prisma.ClientWhereInput = {
      businessId: user.business.id,
      estado: "activo", // Solo clientes activos
      ...searchCondition,
      ...tipoClienteCondition,
    }

    // Obtener clientes con paginación y búsqueda
    const clients = await prisma.client.findMany({
      where: whereCondition,
      orderBy: [{ posicion: "asc" }, { nombre: "asc" }],
      skip,
      take: limit,
    })

    // Procesar los clientes para incluir información del tipo de cliente
    const processedClients = clients.map((client) => {
      let tipoCliente = null
      
      if (client.metadatos) {
        try {
          const metadatos = JSON.parse(client.metadatos)
          if (metadatos.tipoCliente) {
            tipoCliente = metadatos.tipoCliente
          }
        } catch (error) {
          // Ignorar errores de parsing
        }
      }
      
      return {
        ...client,
        tipoCliente,
        fechaAlta: client.fechaAlta?.toISOString(),
        fechaBaja: client.fechaBaja?.toISOString(),
        fechaNacimiento: client.fechaNacimiento?.toISOString(),
        fechaRegistro: client.fechaRegistro?.toISOString(),
      }
    })

    // Obtener el total de clientes para la paginación
    const total = await prisma.client.count({
      where: whereCondition,
    })

    return NextResponse.json({
      clients: processedClients,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error al obtener clientes:", error)
    return NextResponse.json({ error: "Error al obtener los clientes" }, { status: 500 })
  }
}

// POST - Crear un nuevo cliente
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener el usuario con su negocio asociado
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { business: true },
    })

    if (!user?.business?.id) {
      return NextResponse.json({ error: "No se encontró un negocio asociado" }, { status: 404 })
    }

    const data = await req.json()

    // Validar datos con nuestra función de validación
    const validationResult = await validateClient(data, prisma)

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
      // Obtener la posición máxima actual para asignar la siguiente
      const maxPosition = await prisma.client.findFirst({
        where: { businessId: user.business.id },
        orderBy: { posicion: "desc" },
        select: { posicion: true },
      })

      const nextPosition = maxPosition ? maxPosition.posicion + 1 : 0

      // Crear el cliente usando Prisma ORM con los datos validados
      const client = await prisma.client.create({
        data: {
          ...validationResult.data,
          posicion: nextPosition,
          business: {
            connect: {
              id: user.business.id,
            },
          },
          user: {
            connect: {
              id: session.user.id,
            },
          },
        },
      })

      return NextResponse.json({
        id: client.id,
        nombre: client.nombre,
        message: "Cliente creado correctamente",
      })
    } catch (dbError: any) {
      console.error("Error en la base de datos:", dbError)

      // Manejar errores específicos
      if (dbError.code === "P2002") {
        const target = dbError.meta?.target?.[0] || "un campo"
        const fieldMap: Record<string, string> = {
          nifContacto: "NIF/CIF de contacto",
          identificacionVAT: "VAT ID",
        }

        const fieldName = fieldMap[target] || target

        return NextResponse.json(
          {
            error: `Ya existe un cliente con este ${fieldName}`,
          },
          { status: 409 },
        )
      }

      return NextResponse.json(
        {
          error: "Error al crear el cliente en la base de datos",
          details: dbError instanceof Error ? dbError.message : "Error desconocido",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error al crear cliente:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear el cliente" },
      { status: 500 },
    )
  }
}