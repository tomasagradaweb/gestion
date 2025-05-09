"use client"

import * as React from "react"
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ColumnsIcon,
  PlusIcon,
} from "lucide-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface FilterOption {
  value: string;
  label: string;
}

interface TableFilter {
  id: string;
  title: string;
  options: FilterOption[];
}


interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  tableId: string
  onReorder?: (newOrder: string[]) => Promise<any>
  onAdd?: () => void
  addButtonLabel?: string
  searchPlaceholder?: string
  enableDragAndDrop?: boolean
  enableRowSelection?: boolean
  enableColumnVisibility?: boolean
  enablePagination?: boolean
  enableSearch?: boolean
  enableSaveConfig?: boolean
  noResultsMessage?: string
  pageSize?: number
  filters?: TableFilter[]
}


export function DataTable<TData, TValue>({
  columns,
  data: initialData,
  tableId,
  onReorder,
  onAdd,
  addButtonLabel = "Añadir",
  searchPlaceholder = "Buscar...",
  enableDragAndDrop = true,
  enableRowSelection = true,
  enableColumnVisibility = true,
  enablePagination = true,
  enableSearch = true,
  enableSaveConfig = true,
  noResultsMessage = "No hay resultados.",
  pageSize = 10,
  filters, // Añade esta línea
}: DataTableProps<TData, TValue>) {
  const { data: session } = useSession()
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize,
  })
  const sortableId = React.useId()
  const sensors = useSensors(useSensor(MouseSensor, {}), useSensor(TouchSensor, {}), useSensor(KeyboardSensor, {}))
  const [isSaving, setIsSaving] = React.useState(false)
  const [isTableReady, setIsTableReady] = React.useState(false)
  const configRef = React.useRef<any>(null)
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const visibilityChangeRef = React.useRef(false)

  // Actualizar los datos cuando cambien las props
  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  // Función para guardar la configuración inmediatamente
  const saveConfigImmediately = React.useCallback(async () => {
    if (isSaving || !session?.user) return

    setIsSaving(true)

    try {
      // Preparar la configuración a guardar
      const visibilityConfig = { ...columnVisibility }
      if (visibilityConfig.hasOwnProperty("nombre")) {
        visibilityConfig.nombre = true
      }

      const config = {
        columnVisibility: visibilityConfig,
        sorting,
        ...(enablePagination ? { pagination } : {}),
      }

      // Comparar con la configuración anterior
      const configString = JSON.stringify(config)
      const prevConfigString = configRef.current ? JSON.stringify(configRef.current) : null

      // Solo guardar si hay cambios
      if (configString !== prevConfigString) {
        // Actualizar la referencia
        configRef.current = config

        // Guardar en localStorage
        localStorage.setItem(`table-config-${tableId}`, configString)

        // Guardar en API
        await fetch("/api/table-config", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tableId,
            config,
          }),
        })
      }
    } catch (error) {
      console.error("Error al guardar la configuración:", error)
    } finally {
      setIsSaving(false)
      visibilityChangeRef.current = false
    }
  }, [columnVisibility, sorting, pagination, enablePagination, session, tableId, isSaving])

  // Manejador personalizado para cambios de visibilidad de columnas
  const handleColumnVisibilityChange = React.useCallback(
    (state: VisibilityState) => {
      setColumnVisibility(state)
      visibilityChangeRef.current = true

      // Cancelar cualquier timeout pendiente
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Guardar inmediatamente
      saveConfigImmediately()
    },
    [saveConfigImmediately],
  )

  // Inicializar la tabla con la configuración por defecto
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row: any) => row.id?.toString() || "",
    enableRowSelection,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: (updaterOrValue) => {
      const newState =
        typeof updaterOrValue === "function"
          ? updaterOrValue(columnVisibility)
          : updaterOrValue;
      handleColumnVisibilityChange(newState);
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  // Cargar la configuración guardada al iniciar
  React.useEffect(() => {
    if (!enableSaveConfig) {
      setIsTableReady(true)
      return
    }

    const loadTableConfig = async () => {
      try {
        // Intentar cargar desde localStorage primero
        let config = null
        const savedConfig = localStorage.getItem(`table-config-${tableId}`)

        if (savedConfig) {
          try {
            config = JSON.parse(savedConfig)
          } catch (e) {
            console.error("Error al parsear la configuración guardada:", e)
          }
        }

        // Si hay sesión, intentar cargar desde la API
        if (session?.user) {
          try {
            const response = await fetch(`/api/table-config?tableId=${tableId}`)
            if (response.ok) {
              const data = await response.json()
              if (data.config) {
                config = data.config
                // Actualizar localStorage con la versión más reciente
                localStorage.setItem(`table-config-${tableId}`, JSON.stringify(config))
              }
            }
          } catch (error) {
            console.error("Error al cargar desde API:", error)
            // Continuamos con la configuración de localStorage si hay error
          }
        }

        // Aplicar la configuración si existe
        if (config) {
          // Guardar en ref para comparaciones futuras
          configRef.current = config

          // Asegurarse de que la columna "nombre" siempre sea visible
          if (config.columnVisibility) {
            const visibilityConfig = { ...config.columnVisibility }
            if (visibilityConfig.hasOwnProperty("nombre")) {
              visibilityConfig.nombre = true
            }
            setColumnVisibility(visibilityConfig)
          }

          if (config.sorting) {
            setSorting(config.sorting)
          }

          if (config.pagination && enablePagination) {
            setPagination(config.pagination)
          }
        }
      } catch (error) {
        console.error("Error al cargar la configuración:", error)
      } finally {
        // Marcar como listo para mostrar
        setIsTableReady(true)
      }
    }

    // Cargar la configuración
    loadTableConfig()
  }, [enableSaveConfig, tableId, session, enablePagination])

  // Guardar la configuración cuando cambien sorting o pagination (con debounce)
  React.useEffect(() => {
    if (!enableSaveConfig || !session?.user || isSaving || visibilityChangeRef.current) return

    // Cancelar cualquier timeout pendiente
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Configurar un nuevo timeout
    saveTimeoutRef.current = setTimeout(() => {
      saveConfigImmediately()
    }, 1000)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [sorting, pagination, enableSaveConfig, session, isSaving, saveConfigImmediately])

  function handleDragEnd(event: DragEndEvent) {
    if (!enableDragAndDrop || !onReorder) return

    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        const newOrder = arrayMove([...dataIds], oldIndex, newIndex)

        // Llamar a la función de reordenación proporcionada
        onReorder(newOrder as string[]).catch((error) => {
          console.error("Error al reordenar elementos:", error)
          toast.error("Error al guardar el nuevo orden")
        })

        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => (enableDragAndDrop ? data?.map((item: any) => item.id) || [] : []),
    [data, enableDragAndDrop],
  )

  function DraggableRow({ row }: { row: Row<TData> }) {
    const { transform, transition, setNodeRef, isDragging } = useSortable({
      id: (row.original as any).id,
    })

    return (
      <TableRow
        data-state={row.getIsSelected() && "selected"}
        data-dragging={isDragging}
        ref={setNodeRef}
        className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
        style={{
          transform: CSS.Transform.toString(transform),
          transition: transition,
        }}
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
        ))}
      </TableRow>
    )
  }

  // Si la tabla no está lista, mostrar un estado de carga
  if (!isTableReady) {
    return (
      <div className="flex w-full flex-col justify-start gap-6">
        <div className="flex flex-col gap-4 px-4 lg:px-6">
          <div className="h-10 w-48 rounded-md bg-muted animate-pulse"></div>
          <div className="overflow-hidden rounded-lg border">
            <div className="h-64 w-full bg-muted/50 flex items-center justify-center">
              <div className="text-muted-foreground">Cargando configuración...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Renderizar la tabla una vez que esté lista
  return (
    <div className="flex w-full flex-col justify-start gap-6">
      {(enableSearch || enableColumnVisibility || onAdd || filters) && (
        <div className="flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-2">
            {enableSearch && (
              <Input
                placeholder={searchPlaceholder}
                className="max-w-sm"
                onChange={(e) => {
                  table.setGlobalFilter(e.target.value)
                }}
              />
            )}
            
            {/* Filtros de tipo de cliente */}
            {filters?.map((filter) => (
              <div key={filter.id} className="flex items-center ml-2">
                <Select
                  onValueChange={(value) => {
                    if (value === "all") {
                      table.getColumn(filter.id)?.setFilterValue(undefined)
                    } else {
                      table.getColumn(filter.id)?.setFilterValue(value)
                    }
                  }}
                  defaultValue="all"
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={`${filter.title}: Todos`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{filter.title}: Todos</SelectItem>
                    {filter.options.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            {enableColumnVisibility && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ColumnsIcon className="h-4 w-4 mr-2" />
                    <span className="hidden lg:inline">Personalizar Columnas</span>
                    <span className="lg:hidden">Columnas</span>
                    <ChevronDownIcon className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {table
                    .getAllColumns()
                    .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
                    .map((column) => {
                      // No permitir ocultar columnas esenciales como "nombre"
                      const isEssentialColumn = column.id === "nombre"

                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          // Deshabilitar el checkbox para columnas esenciales
                          disabled={isEssentialColumn}
                          onCheckedChange={(value) => {
                            // No permitir ocultar columnas esenciales
                            if (!isEssentialColumn) {
                              column.toggleVisibility(!!value)
                            }
                          }}
                        >
                          {column.id}
                          {isEssentialColumn && <span className="ml-2 text-xs text-muted-foreground">(requerido)</span>}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {onAdd && (
              <Button variant="outline" size="sm" onClick={onAdd}>
                <PlusIcon className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">{addButtonLabel}</span>
                <span className="lg:hidden">Añadir</span>
              </Button>
            )}
          </div>
        </div>
      )}
      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          {enableDragAndDrop ? (
            <DndContext
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
              sensors={sensors}
              id={sortableId}
            >
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="**:data-[slot=table-cell]:first:w-8">
                  {table.getRowModel().rows?.length ? (
                    <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                      {table.getRowModel().rows.map((row) => (
                        <DraggableRow key={row.id} row={row} />
                      ))}
                    </SortableContext>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        {noResultsMessage}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      {noResultsMessage}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
        {enablePagination && (
          <div className="flex items-center justify-between px-4">
            <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
              {table.getFilteredSelectedRowModel().rows.length} de {table.getFilteredRowModel().rows.length} fila(s)
              seleccionada(s).
            </div>
            <div className="flex w-full items-center gap-8 lg:w-fit">
              <div className="hidden items-center gap-2 lg:flex">
                <Label htmlFor="rows-per-page" className="text-sm font-medium">
                  Filas por página
                </Label>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value))
                  }}
                >
                  <SelectTrigger className="w-20" id="rows-per-page">
                    <SelectValue placeholder={table.getState().pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-fit items-center justify-center text-sm font-medium">
                Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
              </div>
              <div className="ml-auto flex items-center gap-2 lg:ml-0">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Ir a la primera página</span>
                  <ChevronsLeftIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Ir a la página anterior</span>
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Ir a la página siguiente</span>
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden size-8 lg:flex"
                  size="icon"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Ir a la última página</span>
                  <ChevronsRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

