// Tipado del formulario DUCA-T.
// Se alinea deliberadamente con el tipo `DucaData` que ya existe en
// lib/duca-extraction.ts, para que el bot de extraccion (Gemini) pueda
// precargar este mismo store sin transformar la forma de los datos.

export interface RutaData {
  paisProcedencia: string;
  aduanaInicio: string;
  depositoOrigen: string;
  lugarEmbarque: string;
  paisDestino: string;
  aduanaDestino: string;
  depositoDestino: string;
  lugarDesembarque: string;
  regimenAduanero: string; // fijo: "Transito internacional"
  modoTransporte: string; // fijo: "Transporte terrestre"
  observaciones: string;
}

export interface ExportadorData {
  tipoDocumento: string;
  numeroDocumento: string;
  nombreRazonSocial: string;
  domicilioFiscal: string;
  tipoDocumentoIdentificacion: string;
  numeroDocumentoIdentificacion: string;
  paisEmision: string;
}

export interface ImportadorData {
  tipoDocumento: string;
  numeroDocumento: string;
  nombreRazonSocial: string;
  domicilioFiscal: string;
  tipoDocumentoIdentificacion: string;
  numeroDocumentoIdentificacion: string;
  paisEmision: string;
}

// Paso 4: Ruta de transito. En el HTML original esta pagina muestra una
// tabla de tramos (pais / aduana de inicio / aduana de paso) que el
// usuario marca/selecciona desde un catalogo. Aqui se modela como un
// arreglo editable de tramos para que el usuario pueda agregar, editar
// y quitar filas libremente.
export interface TramoRutaTransito {
  orden: number;
  pais: string;
  aduanaInicio: string;
  aduanaPaso: string;
}

export interface RutaTransitoData {
  tramos: TramoRutaTransito[];
}

export interface TransportistaData {
  codigo?: string | null;
  nombre?: string | null;
  direccion?: string | null;
  nit?: string | null;
}

export interface ConductorData {
  codigo?: string | null;
  primerNombre?: string | null;
  segundoNombre?: string | null;
  primerApellido?: string | null;
  segundoApellido?: string | null;
  tipoDocumentoIdentificacion?: string | null;
  numeroDocumentoIdentificacion?: string | null;
  fechaVencimientoDocumento?: string | null;
  paisExpedicionDocumento?: string | null;
  numeroPasaporte?: string | null;
  fechaVencimientoPasaporte?: string | null;
  paisEmisionPasaporte?: string | null;
  numeroLicencia?: string | null;
  paisEmisionLicencia?: string | null;
  fechaNacimiento?: string | null;
  paisNacimiento?: string | null;
  // Alias usados por lib/duca-extraction.ts (bot de extraccion)
  nombre?: string | null;
  documento?: string | null;
  tipoDocumento?: string | null;
  licencia?: string | null;
  nacionalidad?: string | null;
}

export interface VehiculoData {
  numeroPlaca?: string | null;
  marca?: string | null;
  modelo?: string | null;
  numeroChasisVin?: string | null;
  numeroMotor?: string | null;
  paisRegistro?: string | null;
  // Alias usado por lib/duca-extraction.ts
  placa?: string | null;
  nacionalidad?: string | null;
}

export interface RemolqueData {
  chasis?: string | null;
  placa?: string | null;
  nacionalidad?: string | null;
}

export interface ContenedorData {
  numero?: string | null;
  tipo?: string | null;
  tamano?: string | null;
}

export interface GastosData {
  transporte?: number | string | null;
  seguro?: number | string | null;
  otros?: number | string | null;
}

export interface MercanciaData {
  descripcion?: string | null;
  numeroMercancia?: string | null;
  cantidad?: number | string | null;
  bultos?: number | string | null;
  claseBultos?: string | null;
  pesoBruto?: number | string | null;
  pesoNeto?: number | string | null;
  valor?: number | string | null;
  paisOrigen?: string | null;
}

export interface EquipamientoData {
  tipoEquipo: string; // "Contenedor" | "Remolque"
  tipoCarga: string; // "Contenerizada" | "Suelto"
  identificacionRemolque: string;
  numeroDispositivoSeguridad: string;
  tipoContenedor: string;
  tamanoEquipamiento: string;
  numeroIdentificacionContenedor: string;
  nacionalidadRemolque: string;
}

export interface DocumentoSoporte {
  id: string;
  nombre: string;
  incluido: boolean;
}

// Estructura completa del tramite DUCA-T, un slice por paso.
export interface DucaFormState {
  ruta: RutaData;
  exportador: ExportadorData;
  importador: ImportadorData;
  rutaTransito: RutaTransitoData;
  transportista: TransportistaData;
  conductor: ConductorData;
  vehiculo: VehiculoData;
  remolque: RemolqueData;
  contenedor: ContenedorData;
  marchamo: string | null;
  gastos: GastosData;
  mercancias: MercanciaData[];
  equipamientos: EquipamientoData[];
  documentos: DocumentoSoporte[];
  referencia?: string | null;
}

export const STEPS = [
  { id: 1, slug: "paso-1", label: "Paso 1 - Ruta" },
  { id: 2, slug: "paso-2", label: "Paso 2 - Exportador" },
  { id: 3, slug: "paso-3", label: "Paso 3 - Importador" },
  { id: 4, slug: "paso-4", label: "Paso 4 - Ruta de transito" },
  { id: 5, slug: "paso-5", label: "Paso 5 - Transportista" },
  { id: 6, slug: "paso-6", label: "Paso 6 - Conductor" },
  { id: 7, slug: "paso-7", label: "Paso 7 - Mercancias" },
  { id: 8, slug: "paso-8", label: "Paso 8 - Documentos" },
  { id: 9, slug: "paso-9", label: "Paso 9 - Equipamiento" },
] as const;

export type StepSlug = (typeof STEPS)[number]["slug"];
