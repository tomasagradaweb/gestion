"use client"

import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface DocumentItem {
  name: string
  url: string
  icon: LucideIcon
  isActive: boolean
}

export function NavDocuments({
  items,
}: {
  items: DocumentItem[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Documents</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                tooltip={item.name}
                asChild={!!item.url}
                isActive={item.isActive}
                className={cn(
                  "hover:bg-accent hover:text-accent-foreground transition-colors duration-200",
                  "focus:bg-accent focus:text-accent-foreground",
                  "data-[active=true]:bg-accent data-[active=true]:text-accent-foreground",
                  "[&_svg:not([class*='text-'])]:text-muted-foreground",
                )}
              >
                {item.url ? (
                  <Link href={item.url}>
                    {item.icon && <item.icon className={cn(item.isActive && "text-foreground")} />}
                    <span>{item.name}</span>
                  </Link>
                ) : (
                  <>
                    {item.icon && <item.icon className={cn(item.isActive && "text-foreground")} />}
                    <span>{item.name}</span>
                  </>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}