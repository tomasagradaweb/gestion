// src/lib/validations/client.ts
import { z } from "zod"
import type { PrismaClient } from "@prisma/client"
import { ClientBase, ClientExtended, prepareClientForDatabase } from "@/types/client";

// Esquema de validación extendido para incluir el tipo de cliente y campos específicos
const clientExtendedSchema = z.object({
  // Campo para distinguir entre empresa y particular
  tipoCliente: z.enum(["empresa", "particular"]).optional(),
  
  // Campos comunes (modelo original)
  nombre: z.string().min(1, "El nombre es obligatorio"),
  nifContacto: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  poblacion: z.string().optional().nullable(),
  codigoPostal: z.string().optional().nullable(),
  provincia: z.string().optional().nullable(),
  pais: z.string().optional().nullable(),
  nombreComercial: z.string().optional().nullable(),
  identificacionVAT: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable(),
  telefono: z.string().optional().nullable(),
  movil: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  fechaNacimiento: z
    .union([
      z.string().optional().nullable(),
      z.date().optional().nullable()
    ])
    .optional()
    .nullable()
    .transform((val) => {
      if (!val) return null
      if (val instanceof Date) return val
      return new Date(val)
    }),
  fechaRegistro: z
    .union([
      z.string().optional().nullable(),
      z.date().optional().nullable()
    ])
    .optional()
    .nullable()
    .transform((val) => {
      if (!val) return null
      if (val instanceof Date) return val
      return new Date(val)
    }),
  estado: z.string().default("activo"),
  tipo: z.string().default("cliente"),
  observaciones: z.string().optional().nullable(),
  contacto: z.string().optional().nullable(),
  idioma: z.string().optional().nullable(),
  moneda: z.string().optional().nullable(),
  posicion: z.number().optional().default(0),
  metadatos: z.string().optional().nullable(),
  
  // Campos adicionales para empresa
  razonSocial: z.string().optional().nullable(),
  cif: z.string().optional().nullable(),
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
  
  // Campos adicionales para particular
  apellidos: z.string().optional().nullable(),
  dni: z.string().optional().nullable(),

  // Campo id para actualizaciones
  id: z.string().optional(),
})

// Esquema original para mantener compatibilidad
export const clientSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  nifContacto: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  poblacion: z.string().optional().nullable(),
  codigoPostal: z.string().optional().nullable(),
  provincia: z.string().optional().nullable(),
  pais: z.string().optional().nullable(),
  nombreComercial: z.string().optional().nullable(),
  identificacionVAT: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable(),
  telefono: z.string().optional().nullable(),
  movil: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  fechaNacimiento: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
  fechaRegistro: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
  estado: z.string().default("activo"),
  tipo: z.string().default("cliente"),
  observaciones: z.string().optional().nullable(),
  contacto: z.string().optional().nullable(),
  idioma: z.string().optional().nullable(),
  moneda: z.string().optional().nullable(),
  posicion: z.number().optional().default(0),
  metadatos: z.string().optional().nullable(),
  id: z.string().optional(),
})

// Tipo para el resultado de la validación
export type ValidationResult = {
  success: boolean
  data?: any  // Mantenemos any por compatibilidad, pero aseguramos que devolvemos el tipo correcto
  error?: string
  details?: any
}

// Función para validar los datos del cliente
export async function validateClient(data: any, prisma: PrismaClient): Promise<ValidationResult> {
  try {
    // Usar el esquema extendido para la validación inicial
    const extendedValidation = clientExtendedSchema.safeParse(data)
    
    if (!extendedValidation.success) {
      return {
        success: false,
        error: "Error de validación",
        details: extendedValidation.error.errors.reduce((acc, curr) => {
          const path = curr.path.join(".")
          acc[path] = curr.message
          return acc
        }, {} as Record<string, string>),
      }
    }
    
    const validatedExtendedData = extendedValidation.data

    // Procesar los datos según el tipo de cliente
    let validatedData: Record<string, any> = {
      nombre: validatedExtendedData.nombre,
      nifContacto: validatedExtendedData.nifContacto,
      direccion: validatedExtendedData.direccion,
      poblacion: validatedExtendedData.poblacion,
      codigoPostal: validatedExtendedData.codigoPostal,
      provincia: validatedExtendedData.provincia,
      pais: validatedExtendedData.pais,
      nombreComercial: validatedExtendedData.nombreComercial,
      identificacionVAT: validatedExtendedData.identificacionVAT,
      email: validatedExtendedData.email,
      telefono: validatedExtendedData.telefono,
      movil: validatedExtendedData.movil,
      website: validatedExtendedData.website,
      fechaNacimiento: validatedExtendedData.fechaNacimiento,
      fechaRegistro: validatedExtendedData.fechaRegistro,
      estado: validatedExtendedData.estado,
      tipo: validatedExtendedData.tipo,
      observaciones: validatedExtendedData.observaciones,
      contacto: validatedExtendedData.contacto,
      idioma: validatedExtendedData.idioma,
      moneda: validatedExtendedData.moneda,
      posicion: validatedExtendedData.posicion || 0,
    }

    // Si hay ID, inclúyalo (para actualizaciones)
    if (validatedExtendedData.id) {
      validatedData.id = validatedExtendedData.id;
    }

    // Si hay un tipo de cliente especificado, procesarlo
    if (validatedExtendedData.tipoCliente) {
      // Crear objeto de metadatos para guardar información adicional
      const metadatosObj: Record<string, any> = {
        tipoCliente: validatedExtendedData.tipoCliente,
      }
      
      if (validatedExtendedData.tipoCliente === "empresa") {
        // Empresa: guardar campos específicos en metadatos
        if (validatedExtendedData.razonSocial) metadatosObj.razonSocial = validatedExtendedData.razonSocial
        if (validatedExtendedData.direccionFiscal) metadatosObj.direccionFiscal = validatedExtendedData.direccionFiscal
        if (validatedExtendedData.poblacionFiscal) metadatosObj.poblacionFiscal = validatedExtendedData.poblacionFiscal
        if (validatedExtendedData.codigoPostalFiscal) metadatosObj.codigoPostalFiscal = validatedExtendedData.codigoPostalFiscal
        if (validatedExtendedData.provinciaFiscal) metadatosObj.provinciaFiscal = validatedExtendedData.provinciaFiscal
        if (validatedExtendedData.paisFiscal) metadatosObj.paisFiscal = validatedExtendedData.paisFiscal
        
        // Guardar dirección comercial si es diferente de la fiscal
        if (validatedExtendedData.direccionComercial) {
          metadatosObj.direccionComercial = validatedExtendedData.direccionComercial
          metadatosObj.poblacionComercial = validatedExtendedData.poblacionComercial
          metadatosObj.codigoPostalComercial = validatedExtendedData.codigoPostalComercial
          metadatosObj.provinciaComercial = validatedExtendedData.provinciaComercial
          metadatosObj.paisComercial = validatedExtendedData.paisComercial
        }
        
        // Para empresas, el CIF va a nifContacto
        if (validatedExtendedData.cif) {
          validatedData.nifContacto = validatedExtendedData.cif
        }
        
        // Usar la dirección comercial para los campos principales
        if (validatedExtendedData.direccionComercial) {
          validatedData.direccion = validatedExtendedData.direccionComercial
          validatedData.poblacion = validatedExtendedData.poblacionComercial
          validatedData.codigoPostal = validatedExtendedData.codigoPostalComercial
          validatedData.provincia = validatedExtendedData.provinciaComercial
          validatedData.pais = validatedExtendedData.paisComercial
        } else if (validatedExtendedData.direccionFiscal) {
          // Si no hay dirección comercial, usar la fiscal
          validatedData.direccion = validatedExtendedData.direccionFiscal
          validatedData.poblacion = validatedExtendedData.poblacionFiscal
          validatedData.codigoPostal = validatedExtendedData.codigoPostalFiscal
          validatedData.provincia = validatedExtendedData.provinciaFiscal
          validatedData.pais = validatedExtendedData.paisFiscal
        }
        
      } else if (validatedExtendedData.tipoCliente === "particular") {
        // Particular: guardar apellidos en metadatos
        if (validatedExtendedData.apellidos) metadatosObj.apellidos = validatedExtendedData.apellidos
        
        // Para particulares, el DNI va a nifContacto
        if (validatedExtendedData.dni) {
          validatedData.nifContacto = validatedExtendedData.dni
        }
        
        // Combinar nombre y apellidos si ambos están presentes
        if (validatedExtendedData.nombre && validatedExtendedData.apellidos) {
          validatedData.nombre = `${validatedExtendedData.nombre} ${validatedExtendedData.apellidos}`.trim()
        }
      }
      
      // Guardar metadatos como JSON
      validatedData.metadatos = JSON.stringify(metadatosObj)
    }

    // Verificar si nifContacto ya existe (si se proporciona)
    if (validatedData.nifContacto) {
      const existingNifContacto = await prisma.client.findFirst({
        where: {
          nifContacto: validatedData.nifContacto,
          ...(data.id ? { NOT: { id: data.id } } : {}),
        },
      })

      if (existingNifContacto) {
        return {
          success: false,
          error: "Ya existe un cliente con este NIF/CIF de contacto",
          details: { field: "nifContacto" },
        }
      }
    }

    // Verificar si identificacionVAT ya existe (si se proporciona)
    if (validatedData.identificacionVAT) {
      const existingVatId = await prisma.client.findFirst({
        where: {
          identificacionVAT: validatedData.identificacionVAT,
          ...(data.id ? { NOT: { id: data.id } } : {}),
        },
      })

      if (existingVatId) {
        return {
          success: false,
          error: "Ya existe un cliente con este VAT ID",
          details: { field: "identificacionVAT" },
        }
      }
    }

    return {
      success: true,
      data: validatedData,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.errors.reduce(
        (acc, curr) => {
          const path = curr.path.join(".")
          acc[path] = curr.message
          return acc
        },
        {} as Record<string, string>,
      )

      return {
        success: false,
        error: "Error de validación",
        details,
      }
    }

    return {
      success: false,
      error: "Error al validar los datos del cliente",
      details: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}