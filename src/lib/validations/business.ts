import { z } from "zod"
import { type PrismaClient } from '@prisma/client'

// Esquema base para negocios
export const businessSchema = z.object({
  name: z.string().min(1, { message: "El nombre del negocio es obligatorio" }),
  taxId: z.string().trim().optional().nullable()
    .transform(val => val === "" ? null : val), // Convierte strings vacíos a null
  address: z.string().trim().optional().nullable()
    .transform(val => val === "" ? null : val),
  city: z.string().trim().optional().nullable()
    .transform(val => val === "" ? null : val),
  postalCode: z.string().trim().optional().nullable()
    .transform(val => val === "" ? null : val),
  province: z.string().trim().optional().nullable()
    .transform(val => val === "" ? null : val),
  country: z.string().trim().optional().nullable()
    .transform(val => val === "" ? null : val),
  email: z.union([
    z.string().trim().email({ message: "Email inválido" }),
    z.string().trim().max(0),
    z.null()
  ]).optional().nullable()
    .transform(val => val === "" ? null : val),
  phone: z.string().trim().optional().nullable()
    .transform(val => val === "" ? null : val),
  website: z.union([
    z.string().trim().url({ message: "URL inválida" }),
    z.string().trim().max(0),
    z.null()
  ]).optional().nullable()
    .transform(val => val === "" ? null : val),
  logo: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
})

// Extendemos el esquema base para incluir id, createdAt y updatedAt
const extendedBusinessSchema = businessSchema.extend({
  id: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Para crear un nuevo negocio
export const createBusinessSchema = extendedBusinessSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Para actualizar un negocio existente
export const updateBusinessSchema = extendedBusinessSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Tipos inferidos de los esquemas
export type Business = z.infer<typeof businessSchema>
export type CreateBusinessInput = z.infer<typeof createBusinessSchema>
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>

// Definiendo tipos para los resultados de validación
type ValidationSuccess<T = any> = {
  success: true;
  data: T;
};

type ValidationError = {
  success: false;
  error: string;
  details?: any;
};

type ValidationResult<T = any> = ValidationSuccess<T> | ValidationError;

// Función para validar unicidad de taxId (separada del esquema)
export async function validateUniqueTaxId(
  taxId: string | null | undefined, 
  prisma: PrismaClient, 
  excludeBusinessId?: string
): Promise<ValidationResult> {
  // Si no hay taxId, no necesitamos validar unicidad
  if (!taxId) return { success: true, data: {} };
  
  try {
    // Buscar negocio con el mismo taxId
    const existingBusiness = await prisma.business.findFirst({
      where: {
        taxId,
        id: excludeBusinessId ? { not: excludeBusinessId } : undefined,
      },
    });
    
    if (existingBusiness) {
      return {
        success: false,
        error: "Ya existe un negocio con este CIF/NIF"
      };
    }
    
    return { success: true, data: {} };
  } catch (error) {
    console.error("Error al validar unicidad de taxId:", error);
    return {
      success: false,
      error: "Error al validar el CIF/NIF",
      details: error instanceof Error ? error.message : "Error desconocido"
    };
  }
}

// Función auxiliar para validar una entidad completa (combina validación de esquema y unicidad)
export async function validateBusiness(
  data: unknown, 
  prisma: PrismaClient, 
  options?: { 
    isUpdate?: boolean, 
    businessId?: string 
  }
): Promise<ValidationResult<CreateBusinessInput | UpdateBusinessInput>> {
  // Primero validamos con el esquema de Zod
  const schema = options?.isUpdate ? updateBusinessSchema : createBusinessSchema;
  const schemaResult = schema.safeParse(data);
  
  if (!schemaResult.success) {
    return {
      success: false,
      error: "Datos de negocio inválidos",
      details: schemaResult.error.format()
    };
  }
  
  // Si hay un taxId, validamos su unicidad
  const validatedData = schemaResult.data;
  if (validatedData.taxId) {
    const uniqueResult = await validateUniqueTaxId(
      validatedData.taxId, 
      prisma,
      options?.businessId
    );
    
    if (!uniqueResult.success) {
      return uniqueResult;
    }
  }
  
  // Todo validado correctamente
  return {
    success: true,
    data: validatedData
  };
}