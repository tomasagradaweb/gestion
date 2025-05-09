// src/app/(protected)/clients/[id]/edit/page.tsx

import React from "react"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import TitlePage from "@/components/title"
import { ClientForm } from "../../components/client-form"
import { BuildingIcon, UserIcon } from "lucide-react"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ClientBase, processClientMetadata } from "@/types/client"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditClientPage({ params }: PageProps) {
  const { id } = await params

  const session = await auth()
  if (!session) {
    redirect("/login")
  }

  const clientRecord = await prisma.client.findFirst({
    where: {
      id,
      user: { businessId: session.user.businessId },
    },
  })
  if (!clientRecord) {
    redirect("/clients")
  }

  const client = processClientMetadata(clientRecord as ClientBase)

  const { title, icon } = (() => {
    if (client.tipoCliente === "empresa") {
      return {
        title: `Editar Empresa: ${client.nombreComercial || client.nombre}`,
        icon: <BuildingIcon className="mr-2 h-5 w-5" />,
      }
    }
    return {
      title: `Editar Particular: ${client.nombre}`,
      icon: <UserIcon className="mr-2 h-5 w-5" />,
    }
  })()

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <main className="container mx-auto py-6">
          <TitlePage name={title} icon={icon} />
          <ClientForm client={client} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
