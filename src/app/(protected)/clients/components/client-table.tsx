// src/app/(protected)/clients/components/client-table.tsx
"use client"

import { useRouter } from "next/navigation"
import { DataTable } from "@/components/data-table"
import { clientColumns } from "@/app/(protected)/clients/components/client-columns"
import type { Client } from "@/app/(protected)/clients/components/client-columns"
import { useState, useEffect } from "react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { PlusIcon, ChevronDownIcon, BuildingIcon, UserIcon } from "lucide-react"

interface ClientTableProps {
  clients: Client[]
  onReorder: (ids: string[]) => Promise<any>
}

export function ClientTable({ clients, onReorder }: ClientTableProps) {
  const router = useRouter()
  const [processedClients, setProcessedClients] = useState<Client[]>([])

  useEffect(() => {
    const processed = clients.map(client => {
      let tipoCliente: "empresa" | "particular" | undefined = undefined
      
      if (client.metadatos) {
        try {
          const metadatos = JSON.parse(client.metadatos)
          if (metadatos.tipoCliente) {
            tipoCliente = metadatos.tipoCliente as "empresa" | "particular"
          }
        } catch (error) {
          // Ignorar errores de parsing
        }
      }
      
      return {
        ...client,
        tipoCliente
      }
    })
    
    setProcessedClients(processed)
  }, [clients])

  const handleAddClient = (type?: "empresa" | "particular") => {
    if (type) {
      router.push(`/clients/new?type=${type}`)
    } else {
      router.push("/clients/new")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Añadir Cliente
              <ChevronDownIcon className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleAddClient("empresa")}>
              <BuildingIcon className="mr-2 h-4 w-4" />
              Empresa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddClient("particular")}>
              <UserIcon className="mr-2 h-4 w-4" />
              Particular
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <DataTable
        columns={clientColumns}
        data={processedClients}
        tableId="clients"
        onReorder={onReorder}
        onAdd={() => handleAddClient()}
        addButtonLabel="Añadir Cliente"
        searchPlaceholder="Buscar clientes..."
        enableDragAndDrop={true}
        enableRowSelection={true}
        enableColumnVisibility={true}
        enablePagination={true}
        enableSearch={true}
        enableSaveConfig={true}
        noResultsMessage="No se encontraron clientes."
        pageSize={10}
        filters={[
          {
            id: "tipoCliente",
            title: "Tipo de Cliente",
            options: [
              { value: "empresa", label: "Empresa" },
              { value: "particular", label: "Particular" },
            ],
          },
          {
            id: "estado",
            title: "Estado",
            options: [
              { value: "activo", label: "Activo" },
              { value: "inactivo", label: "Inactivo" },
            ],
          },
        ]}
      />
    </div>
  )
}