// src/app/(protected)/clients/new/page.tsx
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { ClientForm } from "../components/client-form"
import TitlePage from "@/components/title"
import { BuildingIcon, UserIcon } from "lucide-react"

function getClientType(searchParams: { [key: string]: string | string[] | undefined }): "empresa" | "particular" | undefined {
  const type = searchParams.type
  if (type === "empresa" || type === "particular") {
    return type
  }
  return undefined
}

export default async function NewClientPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const clientType = getClientType(searchParams)

  let title = "Nuevo Cliente"
  let icon = null
  
  if (clientType === "empresa") {
    title = "Nueva Empresa"
    icon = <BuildingIcon className="mr-2 h-5 w-5" />
  } else if (clientType === "particular") {
    title = "Nuevo Particular"
    icon = <UserIcon className="mr-2 h-5 w-5" />
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="container mx-auto py-6">
            <TitlePage name={title} icon={icon} />
            <ClientForm initialClientType={clientType} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
