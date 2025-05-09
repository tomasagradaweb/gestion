"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import {
  BarChartIcon,
  CameraIcon,
  ClipboardListIcon,
  DatabaseIcon,
  FileCodeIcon,
  FileIcon,
  FileTextIcon,
  FolderIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  ListIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
  BuildingIcon,
  type LucideIcon,
} from "lucide-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"

// Importar datos de navegación
import navigationData from "@/data/navigation.json"

// Mapeo de nombres de iconos a componentes de iconos
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboardIcon,
  ListIcon,
  BarChartIcon,
  FolderIcon,
  UsersIcon,
  CameraIcon,
  FileTextIcon,
  FileCodeIcon,
  SettingsIcon,
  HelpCircleIcon,
  SearchIcon,
  DatabaseIcon,
  ClipboardListIcon,
  FileIcon,
}

// Definimos interfaces para nuestros datos de navegación
interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  isActive: boolean
  items?: NavSubItem[]
}

interface NavItemRaw {
  title: string
  url: string
  icon: string
  isActive: boolean
  items?: NavSubItemRaw[]
}

interface NavSubItem {
  title: string
  url: string
  isActive: boolean
}

interface NavSubItemRaw {
  title: string
  url: string
  isActive: boolean
}

interface DocumentItem {
  name: string
  url: string
  icon: LucideIcon
  isActive: boolean
}

interface DocumentItemRaw {
  name: string
  url: string
  icon: string
  isActive: boolean
}

interface NavigationData {
  user: {
    name: string
    email: string
    avatar: string
  }
  navMain: NavItemRaw[]
  navClouds: NavItemRaw[]
  navSecondary: NavItemRaw[]
  documents: DocumentItemRaw[]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session, status } = useSession()
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  // Actualizar el estado activo de los elementos de navegación basado en la ruta actual
  const navData = React.useMemo(() => {
    const updateActiveState = <T extends { url: string; items?: any[] }>(items: T[]): T[] => {
      return items.map((item) => ({
        ...item,
        // Comprobamos si la URL actual comienza con la URL del ítem
        // Esto permite marcar como activo un ítem si estamos en una subruta
        isActive: pathname === item.url || pathname?.startsWith(item.url + "/"),
        ...(item.items ? { items: updateActiveState(item.items) } : {}),
      }))
    }

    return {
      ...navigationData,
      navMain: updateActiveState(navigationData.navMain),
      navClouds: updateActiveState(navigationData.navClouds),
      navSecondary: updateActiveState(navigationData.navSecondary),
      documents: updateActiveState(navigationData.documents),
    } as NavigationData
  }, [pathname])

  useEffect(() => {
    // Si la sesión está cargada y el usuario está autenticado
    if (status === "authenticated" && session?.user) {
      // Obtener el negocio de la API
      const fetchBusiness = async () => {
        try {
          const response = await fetch("/api/business")
          if (response.ok) {
            const data = await response.json()
            if (data.business?.name) {
              setBusinessName(data.business.name)
            }
          }
        } catch (error) {
          console.error("Error al obtener el negocio:", error)
        } finally {
          setLoading(false)
        }
      }

      fetchBusiness()
    } else if (status !== "loading") {
      setLoading(false)
    }
  }, [session, status])

  // Convertir los elementos de navegación para incluir los componentes de iconos
  const navMainWithIcons: NavItem[] = navData.navMain.map((item: NavItemRaw) => ({
    ...item,
    icon: iconMap[item.icon],
  }))

  const documentsWithIcons: DocumentItem[] = navData.documents.map((item: DocumentItemRaw) => ({
    ...item,
    icon: iconMap[item.icon],
  }))

  const navSecondaryWithIcons: NavItem[] = navData.navSecondary.map((item: NavItemRaw) => ({
    ...item,
    icon: iconMap[item.icon],
  }))

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="/dashboard">
                <BuildingIcon className="h-5 w-5" />
                {loading ? (
                  <Skeleton className="h-6 w-32" />
                ) : (
                  <span className="text-base font-semibold">{businessName || "Mi Empresa"}</span>
                )}
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainWithIcons} />
        <NavDocuments items={documentsWithIcons} />
        <NavSecondary items={navSecondaryWithIcons} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}

