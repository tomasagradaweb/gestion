// src/app/(protected)/clients/page.tsx
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ClientTable } from "./components/client-table"
import TitlePage from "@/components/title"

async function handleReorderClients(ids: string[]) {
  "use server"

  try {
    const session = await auth()

    if (!session?.user) {
      return { success: false, error: "No autorizado" }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { business: true },
    })

    if (!user?.business?.id) {
      return { success: false, error: "No se encontró un negocio asociado" }
    }

    const clients = await prisma.client.findMany({
      where: {
        id: { in: ids },
        businessId: user.business.id,
      },
      select: { id: true },
    })

    if (clients.length !== ids.length) {
      return { success: false, error: "Algunos clientes no existen o no pertenecen a tu negocio" }
    }

    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.client.update({
          where: { id },
          data: { posicion: index },
        }),
      ),
    )

    return { success: true }
  } catch (error) {
    console.error("Error al reordenar clientes:", error)
    return { success: false, error }
  }
}

export default async function ClientsPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const clients = await prisma.client.findMany({
    where: {
      usuarioId: session.user.id,
    },
    orderBy: [{ posicion: "asc" }, { nombre: "asc" }],
  })

  const processedClients = clients.map((client: any) => {
    const clientData = { ...client }
    
    if (client.metadatos) {
      try {
        const metadatos = JSON.parse(client.metadatos)
        if (metadatos.tipoCliente) {
          Object.assign(clientData, { tipoCliente: metadatos.tipoCliente })
        }
      } catch (error) {
        console.error("Error al parsear metadatos del cliente:", error)
      }
    }
    
    return clientData
  })

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="container mx-auto py-6">
            <TitlePage name="Clientes" />
            <ClientTable clients={processedClients} onReorder={handleReorderClients} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}