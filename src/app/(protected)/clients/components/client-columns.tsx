//src/app/(protected)/clients/components/client-columns.tsx
"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontalIcon, PencilIcon, TrashIcon, ArrowUpDown, BuildingIcon, UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { GripVerticalIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export type Client = {
  id: string
  posicion: number
  nombre: string
  nifContacto: string | null
  direccion: string | null
  poblacion: string | null
  codigoPostal: string | null
  provincia: string | null
  pais: string | null
  nombreComercial: string | null
  identificacionVAT: string | null
  email: string | null
  telefono: string | null
  movil: string | null
  website: string | null
  fechaNacimiento: Date | null
  fechaRegistro: Date | null
  fechaAlta: Date
  fechaBaja: Date | null
  estado: string
  tipo: string
  observaciones: string | null
  contacto: string | null
  idioma: string | null
  moneda: string | null
  usuarioId: string | null
  businessId: string | null
  metadatos: string | null  
  tipoCliente?: "empresa" | "particular"
}

// Componente para el drag handle
function DragHandle({ id }: { id: string }) {
  return (
    <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:bg-transparent cursor-grab">
      <GripVerticalIcon className="size-3 text-muted-foreground" />
      <span className="sr-only">Arrastrar para reordenar</span>
    </Button>
  )
}

// Componente para el icono del tipo de cliente
function ClientTypeIcon({ type }: { type?: "empresa" | "particular" }) {
  if (!type) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="mr-2">
            {type === "empresa" ? (
              <BuildingIcon className="h-4 w-4 text-slate-600" />
            ) : (
              <UserIcon className="h-4 w-4 text-slate-600" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{type === "empresa" ? "Empresa" : "Particular"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export const clientColumns: ColumnDef<Client>[] = [
  {
    id: "drag",
    header: () => "NIF/CIF",
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Seleccionar todo"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Seleccionar fila"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "tipoCliente",
    header: "Tipo",
    cell: ({ row }) => <ClientTypeIcon type={row.original.tipoCliente} />,
    enableSorting: true,
  },
  {
    accessorKey: "nombre",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Nombre
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      // Determinar si mostrar nombre comercial para empresas
      const tipoCliente = row.original.tipoCliente
      const nombre = row.getValue("nombre") as string
      const nombreComercial = row.original.nombreComercial

      return (
        <div className="flex flex-col">
          <div className="font-medium">{nombre}</div>
          {tipoCliente === "empresa" && nombreComercial && (
            <div className="text-xs text-muted-foreground">{nombreComercial}</div>
          )}
        </div>
      )
    },
    enableHiding: false,
  },
  {
    accessorKey: "nifContacto",
    header: () => "NIF/CIF",
    cell: ({ row }) => {
      const tipoCliente = row.original.tipoCliente
      const nifContacto = row.getValue("nifContacto") as string | null
      const label = tipoCliente === "empresa" ? "CIF: " : "DNI: "
      
      return <div>{nifContacto ? `${label}${nifContacto}` : "-"}</div>
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div>{row.getValue("email") || "-"}</div>,
  },
  {
    accessorKey: "telefono",
    header: "Teléfono",
    cell: ({ row }) => <div>{row.getValue("telefono") || "-"}</div>,
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => {
      const estado = row.getValue("estado") as string
      return (
        <Badge variant={estado === "activo" ? "outline" : "secondary"}>
          {estado === "activo" ? "Activo" : "Inactivo"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "fechaAlta",
    header: "Fecha Alta",
    cell: ({ row }) => {
      const fecha = row.getValue("fechaAlta") as string
      return <div>{fecha ? new Date(fecha).toLocaleDateString() : "-"}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const client = row.original
      const router = useRouter()

      const handleEdit = () => {
        router.push(`/clients/${client.id}/edit`)
      }

      const handleDelete = async () => {
        if (window.confirm("¿Estás seguro de que deseas eliminar este cliente?")) {
          try {
            const response = await fetch(`/api/clients/${client.id}`, {
              method: "DELETE",
            })

            if (response.ok) {
              router.refresh()
            } else {
              const data = await response.json()
              alert(`Error: ${data.error || "No se pudo eliminar el cliente"}`)
            }
          } catch (error) {
            console.error("Error al eliminar cliente:", error)
            alert("Error al eliminar el cliente")
          }
        }
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(client.id)}>Copiar ID</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleEdit}>
              <PencilIcon className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
              <TrashIcon className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]