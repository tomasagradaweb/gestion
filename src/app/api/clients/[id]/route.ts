// src/app/api/clients/[id]/route.ts

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { validateClient } from "@/lib/validations/client"
import { ClientBase, processClientMetadata } from "@/types/client"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  const { id: clientId } = await params

  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener usuario + negocio
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { business: true },
    })
    if (!user?.business?.id) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 })
    }

    // Buscar cliente y verificar pertenencia
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    })
    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }
    if (client.businessId !== user.business.id) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    // Parsear y normalizar metadatos
    const clientData = processClientMetadata(client as ClientBase)
    return NextResponse.json(clientData)
  } catch (error) {
    console.error("Error GET /api/clients/[id]:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// PATCH - Actualizar un cliente
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params

  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Usuario + negocio
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { business: true },
    })
    if (!user?.business?.id) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 })
    }

    // Cliente existente
    const existingClient = await prisma.client.findUnique({
      where: { id: clientId },
    })
    if (!existingClient) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }
    if (existingClient.businessId !== user.business.id) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    // Validación
    const data = await req.json()
    const validation = await validateClient({ ...data, id: clientId }, prisma)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      )
    }

    // Actualización
    const updated = await prisma.client.update({
      where: { id: clientId },
      data: validation.data,
    })
    return NextResponse.json({
      id: updated.id,
      nombre: updated.nombre,
      message: "Cliente actualizado correctamente",
    })
  } catch (dbError: any) {
    console.error("Error PATCH /api/clients/[id]:", dbError)
    if (dbError.code === "P2002") {
      // Violación de unique constraint
      const target = dbError.meta?.target?.[0] || "campo"
      const fieldMap: Record<string, string> = {
        nifContacto: "NIF/CIF de contacto",
        identificacionVAT: "VAT ID",
      }
      const fieldName = fieldMap[target] || target
      return NextResponse.json(
        { error: `Ya existe un cliente con este ${fieldName}` },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: "Error al actualizar cliente" },
      { status: 500 }
    )
  }
}

// DELETE - Borrado lógico de un cliente
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params

  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Usuario + negocio
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { business: true },
    })
    if (!user?.business?.id) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 })
    }

    // Cliente existente
    const existing = await prisma.client.findUnique({ where: { id: clientId } })
    if (!existing) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }
    if (existing.businessId !== user.business.id) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    // Borrado lógico
    const deleted = await prisma.client.update({
      where: { id: clientId },
      data: { estado: "inactivo", fechaBaja: new Date() },
    })
    return NextResponse.json({
      id: deleted.id,
      message: "Cliente eliminado correctamente",
    })
  } catch (error) {
    console.error("Error DELETE /api/clients/[id]:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}