export interface RutaData {
  PaisProcedencia: string;
  AduanaInicio: string;
  PaisDestino: string;
  AduanaDestino: string;
  Observaciones: string;
}

export interface ExportadorData {
  NombreExportador: string;
  DomicilioExportador: string;
  TipoIdentificacionExportador: string;
  NumeroIdentificacionExportador: string;
  PaisExportador: string;
}

export interface ImportadorData {
  NombreImportador: string;
  DomicilioImportador: string;
  TipoIdentificacionImportador: string;
  NumeroIdentificacionImportador: string;
  PaisImportador: string;
}

export interface TramoRutaTransito {
  orden: number;
  AduanaPaso: string;
}

export interface RutaTransitoData {
  tramos: TramoRutaTransito[];
}

export interface TransportistaData {
  CodigoTransportista?: string | null;
}

export interface ConductorData {
  LicenciaConductor?: string | null;
}

export interface VehiculoData {
  PlacaTransporte?: string | null;
}

export interface GastosData {
  ValorFOB?: number | string | null;
  GastosTransporte?: number | string | null;
  GastosSeguro?: number | string | null;
  OtrosGastos?: number | string | null;
  ValorTotal?: number | string | null;
}

export interface MercanciaData {
  PartidaArancelaria?: string | null;
  DescripcionMercancia?: string | null;
  CantidadMercancia?: number | string | null;
  ClaseMercancia?: string | null;
  PaisMercancia?: string | null;
  PesoMercancia?: number | string | null;
}

export interface EquipamientoData {
  TipoEquipamiento: string;
  TipoCarga: string;
  PlacaChasis: string;
  MarchamoSat: string;
  TamañoContenedor: string;
  NumeroContenedor: string;
  PaisChasis: string;
}

export interface DocumentoSoporte {
  id: string;
  incluido: boolean;
  NombreDocumentoPorte?: string;
  TipoDocumentoPorte?: string;
  NumeroDocumentoPorte?: string;
  NombreDocumentoFactura?: string;
  TipoDocumentoFactura?: string;
  NumeroDocumentoFactura?: string;
  NombreDocumentoManifiesto?: string;
  TipoDocumentoManifiesto?: string;
  NumeroDocumentoManifiesto?: string;
  NombreDocumentoBL?: string;
  TipoDocumentoManifiestoBL?: string;
  NumeroDocumentoManifiestoBL?: string;
}

export interface DucaFormState {
  ruta: RutaData;
  exportador: ExportadorData;
  importador: ImportadorData;
  rutaTransito: RutaTransitoData;
  transportista: TransportistaData;
  conductor: ConductorData;
  vehiculo: VehiculoData;
  gastos: GastosData;
  mercancias: MercanciaData[];
  equipamientos: EquipamientoData[];
  documentos: DocumentoSoporte[];
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
