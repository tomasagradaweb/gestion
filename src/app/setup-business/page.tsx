"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Building2, MapPin, Phone, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

// Definimos los pasos del wizard
const steps = [
  {
    id: "info-basica",
    title: "Información Básica",
    description: "Datos principales de tu empresa",
    icon: Building2,
  },
  {
    id: "ubicacion",
    title: "Ubicación",
    description: "Dirección y localización",
    icon: MapPin,
  },
  {
    id: "contacto",
    title: "Contacto",
    description: "Información de contacto",
    icon: Phone,
  },
  {
    id: "confirmacion",
    title: "Confirmación",
    description: "Revisa y confirma",
    icon: CheckCircle2,
  },
]

export default function SetupBusinessPage() {
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const progress = ((currentStep + 1) / steps.length) * 100

  const [formData, setFormData] = useState({
    name: "",
    taxId: "",
    address: "",
    city: "",
    postalCode: "",
    province: "",
    country: "",
    email: "",
    phone: "",
    website: "",
  })

  // Verificación periódica de la sesión
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    const checkSessionInterval = setInterval(async () => {
      try {
        const updatedSession = await update()

        if (!updatedSession) {
          clearInterval(checkSessionInterval)
          toast.error("Tu sesión ha expirado", {
            description: "Por favor, inicia sesión nuevamente",
          })
          router.push("/login")
        }
      } catch (error) {
        console.error("Error al verificar sesión:", error)
        clearInterval(checkSessionInterval)
        toast.error("Problema con la autenticación", {
          description: "Por favor, inicia sesión nuevamente",
        })
        router.push("/login")
      }
    }, 60000) // Verificar cada minuto

    return () => clearInterval(checkSessionInterval)
  }, [status, router, update])

  // Verificar el estado de autenticación antes de cada acción importante
  const verifyAuthentication = async () => {
    await update()

    if (status === "unauthenticated") {
      toast.error("Tu sesión ha expirado", {
        description: "Por favor, inicia sesión nuevamente",
      })
      router.push("/login")
      return false
    }
    return true
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const nextStep = async () => {
    if (!(await verifyAuthentication())) return

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = async () => {
    if (!(await verifyAuthentication())) return

    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!(await verifyAuthentication())) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.status === 401) {
        toast.error("Tu sesión ha expirado", {
          description: "Por favor, inicia sesión nuevamente",
        })
        router.push("/login")
        return
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al crear el negocio")
      }

      toast.success("Negocio creado con éxito", {
        description: "Redirigiendo al dashboard...",
      })

      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 1500)
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Error al crear el negocio",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Si el usuario no está autenticado, mostrar mensaje de carga
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]"></div>
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  // Si el usuario no está autenticado, redirigir al login
  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  // Renderizar el paso actual del formulario
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Información Básica
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Negocio *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Nombre de tu empresa o negocio"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxId">CIF/NIF</Label>
              <Input
                id="taxId"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                placeholder="Identificación fiscal"
              />
            </div>
          </div>
        )

      case 1: // Ubicación
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Dirección completa"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" name="city" value={formData.city} onChange={handleChange} placeholder="Ciudad" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Código Postal</Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="Código Postal"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="province">Provincia</Label>
                <Input
                  id="province"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  placeholder="Provincia"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="País"
                />
              </div>
            </div>
          </div>
        )

      case 2: // Contacto
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email de Contacto</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email de contacto del negocio"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="Teléfono" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Sitio Web</Label>
                <Input
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://www.ejemplo.com"
                />
              </div>
            </div>
          </div>
        )

      case 3: // Confirmación
        return (
          <div className="space-y-6">
            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium">Información Básica</h4>
                  <Separator className="my-2" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Nombre:</span>
                      <p className="font-medium">{formData.name || "No especificado"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">CIF/NIF:</span>
                      <p className="font-medium">{formData.taxId || "No especificado"}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium">Ubicación</h4>
                  <Separator className="my-2" />
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">Dirección:</span>
                      <p className="font-medium">{formData.address || "No especificada"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Localidad:</span>
                      <p className="font-medium">
                        {[formData.city, formData.postalCode, formData.province, formData.country]
                          .filter(Boolean)
                          .join(", ") || "No especificada"}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium">Contacto</h4>
                  <Separator className="my-2" />
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-medium">{formData.email || "No especificado"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Teléfono:</span>
                      <p className="font-medium">{formData.phone || "No especificado"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Web:</span>
                      <p className="font-medium">{formData.website || "No especificada"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4 bg-primary/5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <p className="text-sm">
                  Al crear tu negocio, podrás gestionar clientes, facturas y más desde tu dashboard.
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <div className="text-center mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Configura tu Negocio</h1>
        <p className="text-muted-foreground">Completa estos pasos para comenzar a utilizar la plataforma</p>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full">
                {React.createElement(steps[currentStep].icon, { className: "h-5 w-5 text-primary" })}
              </div>
              <div>
                <CardTitle>{steps[currentStep].title}</CardTitle>
                <CardDescription>{steps[currentStep].description}</CardDescription>
              </div>
            </div>
            <div className="text-sm font-medium text-muted-foreground">
              Paso {currentStep + 1} de {steps.length}
            </div>
          </div>
          <Progress value={progress} className="h-1" />
        </CardHeader>

        <CardContent className="pt-6">
          <form
            id="business-form"
            onSubmit={currentStep === steps.length - 1 ? handleSubmit : (e) => e.preventDefault()}
          >
            <div className="min-h-[280px]">{renderStepContent()}</div>
          </form>
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-6">
          <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 0} size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button type="button" onClick={nextStep} disabled={currentStep === 0 && !formData.name} size="sm">
              Siguiente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" form="business-form" disabled={isLoading || !formData.name} size="sm">
              {isLoading ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                  Guardando...
                </>
              ) : (
                "Crear Negocio"
              )}
            </Button>
          )}
        </CardFooter>
      </Card>

      <div className="flex justify-center mt-8">
        <div className="flex gap-1">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                index <= currentStep ? "w-8 bg-primary" : "w-4 bg-muted",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

