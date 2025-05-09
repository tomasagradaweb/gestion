"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, SubmitHandler } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { CalendarIcon, Loader2Icon, BuildingIcon, UserIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

function formatDate(date: Date | null): string {
  if (!date) return ""
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

const clientFormSchema = z.object({
  tipoCliente: z.enum(["empresa", "particular"]),
  
  // Campos comunes
  nombre: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Email inválido").optional().nullable(),
  telefono: z.string().optional().nullable(),
  movil: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  estado: z.string().min(1, "El estado es obligatorio").default("activo"),
  tipo: z.string().min(1, "El tipo es obligatorio").default("cliente"),
  observaciones: z.string().optional().nullable(),
  idioma: z.string().optional().nullable(),
  moneda: z.string().optional().nullable(),
  
  // Campos específicos para empresas
  razonSocial: z.string().optional().nullable(),
  nombreComercial: z.string().optional().nullable(),
  cif: z.string().optional().nullable(),
  identificacionVAT: z.string().optional().nullable(),
  direccionFiscal: z.string().optional().nullable(),
  direccionComercial: z.string().optional().nullable(),
  poblacionFiscal: z.string().optional().nullable(),
  codigoPostalFiscal: z.string().optional().nullable(),
  provinciaFiscal: z.string().optional().nullable(),
  paisFiscal: z.string().optional().nullable(),
  poblacionComercial: z.string().optional().nullable(),
  codigoPostalComercial: z.string().optional().nullable(),
  provinciaComercial: z.string().optional().nullable(),
  paisComercial: z.string().optional().nullable(),
  
  // Campos específicos para particulares
  apellidos: z.string().optional().nullable(),
  dni: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  poblacion: z.string().optional().nullable(),
  codigoPostal: z.string().optional().nullable(),
  provincia: z.string().optional().nullable(),
  pais: z.string().optional().nullable(),
  fechaNacimiento: z.date().optional().nullable(),
  
  // Campos adicionales
  fechaRegistro: z.date().optional().nullable(),
  contacto: z.string().optional().nullable(),
})

type ClientFormValues = z.infer<typeof clientFormSchema>


const defaultValues: ClientFormValues = {
  tipoCliente: "empresa",
  nombre: "",
  email: "",
  telefono: "",
  movil: "",
  website: "",
  estado: "activo",
  tipo: "cliente",
  observaciones: "",
  idioma: "es",
  moneda: "EUR",
  
  // Valores por defecto para empresas
  razonSocial: "",
  nombreComercial: "",
  cif: "",
  identificacionVAT: "",
  direccionFiscal: "",
  direccionComercial: "",
  poblacionFiscal: "",
  codigoPostalFiscal: "",
  provinciaFiscal: "",
  paisFiscal: "",
  poblacionComercial: "",
  codigoPostalComercial: "",
  provinciaComercial: "",
  paisComercial: "",
  
  // Valores por defecto para particulares
  apellidos: "",
  dni: "",
  direccion: "",
  poblacion: "",
  codigoPostal: "",
  provincia: "",
  pais: "",
  fechaNacimiento: null,
  
  // Otros valores
  fechaRegistro: null,
  contacto: "",
}

interface ClientFormProps {
  client?: any 
  initialClientType?: "empresa" | "particular"
}

export function ClientForm({ client, initialClientType }: ClientFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!client
  const [useSameAddress, setUseSameAddress] = useState(true)


  const determineClientType = (clientData: any) => {

    if (initialClientType) return initialClientType
    
    if (!clientData) return "empresa"
    

    if (clientData.tipoCliente) {
      return clientData.tipoCliente
    }
    

    if (clientData.metadatos) {
      try {
        const metadatos = JSON.parse(clientData.metadatos)
        if (metadatos.tipoCliente) {
          return metadatos.tipoCliente
        }
      } catch (e) {

      }
    }
    

    if (clientData.cif || clientData.razonSocial) {
      return "empresa"
    }
    

    if (clientData.dni || clientData.apellidos) {
      return "particular"
    }
    

    return "empresa"
  }


  const initialValues = client
    ? {
        ...defaultValues,
        ...client,
        tipoCliente: determineClientType(client),

        fechaNacimiento: client.fechaNacimiento ? new Date(client.fechaNacimiento) : null,
        fechaRegistro: client.fechaRegistro ? new Date(client.fechaRegistro) : null,
      }
    : {
        ...defaultValues,
        tipoCliente: determineClientType({ tipoCliente: initialClientType }),
      }

  const form = useForm({
    resolver: zodResolver(clientFormSchema),
    defaultValues: initialValues,
  })

  const tipoCliente = form.watch("tipoCliente")
  

  useEffect(() => {
    if (tipoCliente === "empresa") {

      form.setValue("apellidos", "")
      form.setValue("dni", "")
      form.setValue("fechaNacimiento", null)
      

      if (!isEditing) {
        form.setValue("direccion", "")
        form.setValue("poblacion", "")
        form.setValue("codigoPostal", "")
        form.setValue("provincia", "")
        form.setValue("pais", "")
      }
    } else {

      form.setValue("razonSocial", "")
      form.setValue("nombreComercial", "")
      form.setValue("cif", "")
      form.setValue("identificacionVAT", "")
      form.setValue("direccionFiscal", "")
      form.setValue("poblacionFiscal", "")
      form.setValue("codigoPostalFiscal", "")
      form.setValue("provinciaFiscal", "")
      form.setValue("paisFiscal", "")
      form.setValue("direccionComercial", "")
      form.setValue("poblacionComercial", "")
      form.setValue("codigoPostalComercial", "")
      form.setValue("provinciaComercial", "")
      form.setValue("paisComercial", "")
    }
  }, [tipoCliente, form, isEditing])
  
  // Efecto para copiar dirección fiscal a comercial cuando la opción está marcada
  useEffect(() => {
    if (tipoCliente === "empresa" && useSameAddress) {
      const direccionFiscal = form.getValues("direccionFiscal")
      const poblacionFiscal = form.getValues("poblacionFiscal")
      const codigoPostalFiscal = form.getValues("codigoPostalFiscal")
      const provinciaFiscal = form.getValues("provinciaFiscal")
      const paisFiscal = form.getValues("paisFiscal")
      
      form.setValue("direccionComercial", direccionFiscal)
      form.setValue("poblacionComercial", poblacionFiscal)
      form.setValue("codigoPostalComercial", codigoPostalFiscal)
      form.setValue("provinciaComercial", provinciaFiscal)
      form.setValue("paisComercial", paisFiscal)
    }
  }, [
    form.watch("direccionFiscal"),
    form.watch("poblacionFiscal"),
    form.watch("codigoPostalFiscal"),
    form.watch("provinciaFiscal"),
    form.watch("paisFiscal"),
    useSameAddress,
    tipoCliente,
    form
  ])

  async function onSubmit(data: ClientFormValues) {
    setIsSubmitting(true)

    try {

      const adaptedData = {
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono,
        movil: data.movil,
        website: data.website,
        estado: data.estado,
        tipo: data.tipo,
        observaciones: data.observaciones,
        idioma: data.idioma,
        moneda: data.moneda,
        fechaRegistro: data.fechaRegistro ? data.fechaRegistro.toISOString() : null,
        contacto: data.contacto,
      }
      
      if (data.tipoCliente === "empresa") {
        Object.assign(adaptedData, {
          nombreComercial: data.nombreComercial,
          nifContacto: data.cif, // Mapear a los campos existentes en Prisma
          direccion: data.direccionComercial || data.direccionFiscal,
          poblacion: data.poblacionComercial || data.poblacionFiscal,
          codigoPostal: data.codigoPostalComercial || data.codigoPostalFiscal,
          provincia: data.provinciaComercial || data.provinciaFiscal,
          pais: data.paisComercial || data.paisFiscal,
          identificacionVAT: data.identificacionVAT,

          metadatos: JSON.stringify({
            tipoCliente: "empresa",
            razonSocial: data.razonSocial,
            direccionFiscal: data.direccionFiscal,
            poblacionFiscal: data.poblacionFiscal,
            codigoPostalFiscal: data.codigoPostalFiscal,
            provinciaFiscal: data.provinciaFiscal,
            paisFiscal: data.paisFiscal,

            ...(useSameAddress ? {} : {
              direccionComercial: data.direccionComercial,
              poblacionComercial: data.poblacionComercial,
              codigoPostalComercial: data.codigoPostalComercial,
              provinciaComercial: data.provinciaComercial,
              paisComercial: data.paisComercial,
            }),
          })
        })
      } else {

        Object.assign(adaptedData, {
          nombre: `${data.nombre} ${data.apellidos || ''}`.trim(),
          nifContacto: data.dni,
          direccion: data.direccion,
          poblacion: data.poblacion,
          codigoPostal: data.codigoPostal,
          provincia: data.provincia,
          pais: data.pais,
          fechaNacimiento: data.fechaNacimiento ? data.fechaNacimiento.toISOString() : null,

          metadatos: JSON.stringify({
            tipoCliente: "particular",
            nombre: data.nombre,
            apellidos: data.apellidos,
          })
        })
      }

      const url = isEditing ? `/api/clients/${client.id}` : "/api/clients"
      const method = isEditing ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(adaptedData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Error al ${isEditing ? "actualizar" : "crear"} el cliente`)
      }

      toast.success(`Cliente ${isEditing ? "actualizado" : "creado"} correctamente`)
      router.push("/clients")
      router.refresh()
    } catch (error) {
      console.error(`Error al ${isEditing ? "actualizar" : "crear"} cliente:`, error)
      toast.error(error instanceof Error ? error.message : `Error al ${isEditing ? "actualizar" : "crear"} el cliente`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Renderizar formulario diferente según el tipo de cliente
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit as SubmitHandler<ClientFormValues>)} className="space-y-8 px-4 lg:px-6">
        {/* Tipo de cliente (Empresa/Particular) */}
        <Card>
          <CardHeader>
            <CardTitle>Tipo de Cliente</CardTitle>
            <CardDescription>Seleccione el tipo de cliente para mostrar los campos relevantes.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="tipoCliente"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col sm:flex-row sm:space-x-6 space-y-2 sm:space-y-0"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="empresa" id="empresa" />
                        <FormLabel htmlFor="empresa" className="flex items-center">
                          <BuildingIcon className="mr-2 h-5 w-5" />
                          Empresa
                        </FormLabel>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="particular" id="particular" />
                        <FormLabel htmlFor="particular" className="flex items-center">
                          <UserIcon className="mr-2 h-5 w-5" />
                          Particular
                        </FormLabel>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Información General</TabsTrigger>
            <TabsTrigger value="direccion">Dirección</TabsTrigger>
            <TabsTrigger value="adicional">Información Adicional</TabsTrigger>
          </TabsList>

          {/* Pestaña de Información General */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
                <CardDescription>
                  {tipoCliente === "empresa" 
                    ? "Introduce la información básica de la empresa." 
                    : "Introduce la información básica del particular."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {tipoCliente === "empresa" ? (
                  // Campos para empresa
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="razonSocial"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Razón Social <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Razón social de la empresa" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="nombreComercial"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre Comercial</FormLabel>
                            <FormControl>
                              <Input placeholder="Nombre comercial" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="cif"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CIF</FormLabel>
                            <FormControl>
                              <Input placeholder="CIF de la empresa" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="identificacionVAT"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>VAT ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Identificación VAT" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                ) : (
                  // Campos para particular
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="nombre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Nombre <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Nombre" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="apellidos"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Apellidos</FormLabel>
                            <FormControl>
                              <Input placeholder="Apellidos" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="dni"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>DNI/NIE</FormLabel>
                            <FormControl>
                              <Input placeholder="DNI o NIE" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fechaNacimiento"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Fecha de Nacimiento</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                                  >
                                    {field.value ? formatDate(field.value) : <span>Seleccionar fecha</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value || undefined}
                                  onSelect={field.onChange}
                                  disabled={(date: Date) => date > new Date() || date < new Date("1900-01-01")}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                {/* Campos comunes de contacto */}
                <Separator className="my-4" />
                <h3 className="text-lg font-medium mb-4">Información de Contacto</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@ejemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telefono"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="Teléfono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="movil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Móvil</FormLabel>
                        <FormControl>
                          <Input placeholder="Móvil" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sitio Web</FormLabel>
                        <FormControl>
                          <Input placeholder="https://ejemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cliente">Cliente</SelectItem>
                            <SelectItem value="proveedor">Proveedor</SelectItem>
                            <SelectItem value="potencial">Cliente Potencial</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="activo">Activo</SelectItem>
                            <SelectItem value="inactivo">Inactivo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña de Dirección */}
          <TabsContent value="direccion">
            <Card>
              <CardHeader>
                <CardTitle>
                  {tipoCliente === "empresa" ? "Direcciones de la Empresa" : "Dirección"}
                </CardTitle>
                <CardDescription>
                  {tipoCliente === "empresa" 
                    ? "Introduce las direcciones fiscal y comercial de la empresa." 
                    : "Introduce la dirección de contacto."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {tipoCliente === "empresa" ? (
                  // Direcciones para empresa
                  <>
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium">Dirección Fiscal</h3>
                      <FormField
                        control={form.control}
                        name="direccionFiscal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dirección Fiscal</FormLabel>
                            <FormControl>
                              <Input placeholder="Dirección fiscal" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="poblacionFiscal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Población</FormLabel>
                              <FormControl>
                                <Input placeholder="Población" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="codigoPostalFiscal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Código Postal</FormLabel>
                              <FormControl>
                                <Input placeholder="Código Postal" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="provinciaFiscal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Provincia</FormLabel>
                              <FormControl>
                                <Input placeholder="Provincia" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="paisFiscal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>País</FormLabel>
                              <FormControl>
                                <Input placeholder="País" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator className="my-6" />
                    
                    <div className="mb-6">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="sameAddress"
                          checked={useSameAddress}
                          onChange={(e) => setUseSameAddress(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="sameAddress" className="text-sm font-medium text-gray-700">
                          La dirección comercial es la misma que la fiscal
                        </label>
                      </div>
                    </div>

                    {!useSameAddress && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-medium">Dirección Comercial</h3>
                        <FormField
                          control={form.control}
                          name="direccionComercial"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dirección Comercial</FormLabel>
                              <FormControl>
                                <Input placeholder="Dirección comercial" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="poblacionComercial"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Población</FormLabel>
                                <FormControl>
                                  <Input placeholder="Población" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="codigoPostalComercial"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Código Postal</FormLabel>
                                <FormControl>
                                  <Input placeholder="Código Postal" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="provinciaComercial"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Provincia</FormLabel>
                                <FormControl>
                                  <Input placeholder="Provincia" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="paisComercial"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>País</FormLabel>
                                <FormControl>
                                  <Input placeholder="País" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // Dirección para particular
                  <>
                    <FormField
                      control={form.control}
                      name="direccion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección</FormLabel>
                          <FormControl>
                            <Input placeholder="Dirección" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="poblacion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Población</FormLabel>
                            <FormControl>
                              <Input placeholder="Población" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="codigoPostal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código Postal</FormLabel>
                            <FormControl>
                              <Input placeholder="Código Postal" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="provincia"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Provincia</FormLabel>
                            <FormControl>
                              <Input placeholder="Provincia" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="pais"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>País</FormLabel>
                            <FormControl>
                              <Input placeholder="País" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña de Información Adicional */}
          <TabsContent value="adicional">
            <Card>
              <CardHeader>
                <CardTitle>Información Adicional</CardTitle>
                <CardDescription>Detalles adicionales y preferencias del cliente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="fechaRegistro"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de Registro</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                              >
                                {field.value ? formatDate(field.value) : <span>Seleccionar fecha</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              disabled={(date: Date) => date > new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contacto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Persona de Contacto</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre de la persona de contacto" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="idioma"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Idioma</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un idioma" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="en">Inglés</SelectItem>
                            <SelectItem value="fr">Francés</SelectItem>
                            <SelectItem value="de">Alemán</SelectItem>
                            <SelectItem value="it">Italiano</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="moneda"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Moneda</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una moneda" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="EUR">Euro (€)</SelectItem>
                            <SelectItem value="USD">Dólar ($)</SelectItem>
                            <SelectItem value="GBP">Libra (£)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="observaciones"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observaciones</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observaciones o notas adicionales"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/clients")} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Actualizar Cliente" : "Guardar Cliente"}
          </Button>
        </div>
      </form>
    </Form>
  )
}