//src/app/api/clients/components/client-table.tsx
"use client"

import { useRouter } from "next/navigation"
import { DataTable } from "@/components/data-table"
import { clientColumns } from "@/app/(protected)/clients/components/client-columns"
import type { Client } from "@/app/(protected)/clients/components/client-columns"

interface ClientTableProps {
  clients: Client[]
  onReorder: (ids: string[]) => Promise<any>
}

export function ClientTable({ clients, onReorder }: ClientTableProps) {
  const router = useRouter()

  const handleAddClient = () => {
    router.push("/clients/new")
  }

  return (
    <DataTable
      columns={clientColumns}
      data={clients}
      tableId="clients"
      onReorder={onReorder}
      onAdd={handleAddClient}
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
    />
  )
}