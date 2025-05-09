// src/types/client.ts
import { Client as PrismaClient } from "@prisma/client";

// Tipo base que extiende el modelo de Prisma, manteniendo nullability correcta
export interface ClientBase {
  // Campos obligatorios del modelo Prisma
  id: string;
  nombre: string;
  posicion: number;
  estado: string;
  tipo: string;
  fechaAlta: Date;
  
  // Campos opcionales del modelo Prisma
  nifContacto: string | null;
  direccion: string | null;
  poblacion: string | null;
  codigoPostal: string | null;
  provincia: string | null;
  pais: string | null;
  nombreComercial: string | null;
  identificacionVAT: string | null;
  email: string | null;
  telefono: string | null;
  movil: string | null;
  website: string | null;
  fechaNacimiento: Date | null;
  fechaRegistro: Date | null;
  fechaBaja: Date | null;
  observaciones: string | null;
  contacto: string | null;
  idioma: string | null;
  moneda: string | null;
  metadatos: string | null;
  
  // Relaciones
  usuarioId: string | null;
  businessId: string | null;
}

// Campos comunes para cualquier tipo de cliente extendido
export interface ClientExtended extends ClientBase {
  tipoCliente?: "empresa" | "particular";
  
  // Campos adicionales que no forman parte del modelo Prisma
  // Empresa
  razonSocial?: string | null;
  cif?: string | null;
  direccionFiscal?: string | null;
  poblacionFiscal?: string | null;
  codigoPostalFiscal?: string | null;
  provinciaFiscal?: string | null;
  paisFiscal?: string | null;
  direccionComercial?: string | null;
  poblacionComercial?: string | null;
  codigoPostalComercial?: string | null;
  provinciaComercial?: string | null;
  paisComercial?: string | null;
  
  // Particular
  dni?: string | null;
  apellidos?: string | null;
}

// Función de ayuda para procesar metadatos y convertir un cliente base a extendido
export function processClientMetadata(client: ClientBase): ClientExtended {
  let clientData: ClientExtended = { ...client };
  
  if (client.metadatos) {
    try {
      const metadatos = JSON.parse(client.metadatos);
      
      // Fusionar metadatos con los datos del cliente
      clientData = { ...clientData, ...metadatos };
      
      // Mapear campos específicos
      if (metadatos.tipoCliente === "empresa") {
        if (client.nifContacto) clientData.cif = client.nifContacto;
      } else if (metadatos.tipoCliente === "particular") {
        if (client.nifContacto) clientData.dni = client.nifContacto;
        
        // Si el nombre completo contiene apellidos, extraer solo el nombre
        if (metadatos.apellidos && client.nombre.includes(metadatos.apellidos)) {
          const nombreSinApellidos = client.nombre.replace(metadatos.apellidos, "").trim();
          if (nombreSinApellidos) {
            clientData.nombre = nombreSinApellidos;
          }
        }
      }
    } catch (error) {
      console.error("Error al procesar metadatos:", error);
    }
  }
  
  return clientData;
}

// Función para convertir de ClientExtended a ClientBase (para guardar en DB)
export function prepareClientForDatabase(client: ClientExtended): ClientBase {
  // Extrae solo los campos que existen en el modelo de Prisma
  const baseClient: ClientBase = {
    id: client.id,
    nombre: client.nombre,
    nifContacto: client.nifContacto,
    direccion: client.direccion,
    poblacion: client.poblacion,
    codigoPostal: client.codigoPostal,
    provincia: client.provincia,
    pais: client.pais,
    nombreComercial: client.nombreComercial,
    identificacionVAT: client.identificacionVAT,
    email: client.email,
    telefono: client.telefono,
    movil: client.movil,
    website: client.website,
    fechaNacimiento: client.fechaNacimiento,
    fechaRegistro: client.fechaRegistro,
    fechaAlta: client.fechaAlta,
    fechaBaja: client.fechaBaja,
    estado: client.estado,
    tipo: client.tipo,
    observaciones: client.observaciones,
    contacto: client.contacto,
    idioma: client.idioma,
    moneda: client.moneda,
    posicion: client.posicion,
    usuarioId: client.usuarioId,
    businessId: client.businessId,
    metadatos: null // Vamos a recalcularlo
  };
  
  // Crear el objeto de metadatos
  if (client.tipoCliente) {
    const metadatosObj: Record<string, any> = {
      tipoCliente: client.tipoCliente,
    };
    
    // Añadir campos específicos según el tipo
    if (client.tipoCliente === "empresa") {
      if (client.razonSocial) metadatosObj.razonSocial = client.razonSocial;
      if (client.direccionFiscal) metadatosObj.direccionFiscal = client.direccionFiscal;
      if (client.poblacionFiscal) metadatosObj.poblacionFiscal = client.poblacionFiscal;
      if (client.codigoPostalFiscal) metadatosObj.codigoPostalFiscal = client.codigoPostalFiscal;
      if (client.provinciaFiscal) metadatosObj.provinciaFiscal = client.provinciaFiscal;
      if (client.paisFiscal) metadatosObj.paisFiscal = client.paisFiscal;
      
      // Añadir dirección comercial si existe
      if (client.direccionComercial) {
        metadatosObj.direccionComercial = client.direccionComercial;
        metadatosObj.poblacionComercial = client.poblacionComercial;
        metadatosObj.codigoPostalComercial = client.codigoPostalComercial;
        metadatosObj.provinciaComercial = client.provinciaComercial;
        metadatosObj.paisComercial = client.paisComercial;
      }
    } else if (client.tipoCliente === "particular") {
      if (client.apellidos) metadatosObj.apellidos = client.apellidos;
    }
    
    // Serializar los metadatos
    baseClient.metadatos = JSON.stringify(metadatosObj);
  }
  
  return baseClient;
}