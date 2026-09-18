"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  DucaFormState,
  RutaData,
  ExportadorData,
  ImportadorData,
  RutaTransitoData,
  MercanciaData,
  EquipamientoData,
  TramoRutaTransito,
} from "@/types/duca";

const initialState: DucaFormState = {
  ruta: {
    paisProcedencia: "",
    aduanaInicio: "",
    depositoOrigen: "",
    lugarEmbarque: "",
    paisDestino: "",
    aduanaDestino: "",
    depositoDestino: "",
    lugarDesembarque: "",
    regimenAduanero: "Transito internacional",
    modoTransporte: "Transporte terrestre",
    observaciones: "",
  },
  exportador: {
    tipoDocumento: "",
    numeroDocumento: "",
    nombreRazonSocial: "",
    domicilioFiscal: "",
    tipoDocumentoIdentificacion: "",
    numeroDocumentoIdentificacion: "",
    paisEmision: "",
  },
  importador: {
    tipoDocumento: "",
    numeroDocumento: "",
    nombreRazonSocial: "",
    domicilioFiscal: "",
    tipoDocumentoIdentificacion: "",
    numeroDocumentoIdentificacion: "",
    paisEmision: "",
  },
  rutaTransito: {
    tramos: [],
  },
  transportista: {},
  conductor: {},
  vehiculo: {},
  remolque: {},
  contenedor: {},
  marchamo: "",
  gastos: { transporte: 1, seguro: 1, otros: 0 },
  mercancias: [],
  equipamientos: [],
  documentos: [],
  referencia: "",
};

interface DucaFormActions {
  /** Paso 1 */
  updateRuta: (patch: Partial<RutaData>) => void;
  /** Paso 2 */
  updateExportador: (patch: Partial<ExportadorData>) => void;
  /** Paso 3 */
  updateImportador: (patch: Partial<ImportadorData>) => void;
  /** Paso 4 */
  updateRutaTransito: (patch: Partial<RutaTransitoData>) => void;
  addTramoRuta: (tramo: Omit<TramoRutaTransito, "orden">) => void;
  updateTramoRuta: (index: number, patch: Partial<TramoRutaTransito>) => void;
  removeTramoRuta: (index: number) => void;
  /** Genérico: útil para pasos 5-9 (transportista, conductor, mercancias, etc.) */
  updateField: <K extends keyof DucaFormState>(
    section: K,
    patch: Partial<DucaFormState[K]>,
  ) => void;
  addMercancia: (item: MercanciaData) => void;
  removeMercancia: (index: number) => void;
  addEquipamiento: (item: EquipamientoData) => void;
  removeEquipamiento: (index: number) => void;
  addDocumento: (doc: { id: string; nombre: string }) => void;
  toggleDocumento: (id: string) => void;
  removeDocumento: (id: string) => void;

  /** Navegación */
  currentStep: number;
  maxStepReached: number;
  goToStep: (step: number) => void;
  markStepComplete: (step: number) => void;

  /** Utilidades */
  hydrateFromExtraction: (data: Partial<DucaFormState>) => void;
  resetForm: () => void;
}

type DucaFormStore = DucaFormState & DucaFormActions;

export const useDucaFormStore = create<DucaFormStore>()(
  persist(
    (set) => ({
      ...initialState,
      currentStep: 1,
      maxStepReached: 1,

      updateRuta: (patch) =>
        set((state) => ({ ruta: { ...state.ruta, ...patch } })),

      updateExportador: (patch) =>
        set((state) => ({ exportador: { ...state.exportador, ...patch } })),

      updateImportador: (patch) =>
        set((state) => ({ importador: { ...state.importador, ...patch } })),

      updateRutaTransito: (patch) =>
        set((state) => ({ rutaTransito: { ...state.rutaTransito, ...patch } })),

      addTramoRuta: (tramo) =>
        set((state) => ({
          rutaTransito: {
            tramos: [
              ...state.rutaTransito.tramos,
              { ...tramo, orden: state.rutaTransito.tramos.length + 1 },
            ],
          },
        })),

      updateTramoRuta: (index, patch) =>
        set((state) => ({
          rutaTransito: {
            tramos: state.rutaTransito.tramos.map((t, i) =>
              i === index ? { ...t, ...patch } : t,
            ),
          },
        })),

      removeTramoRuta: (index) =>
        set((state) => ({
          rutaTransito: {
            tramos: state.rutaTransito.tramos
              .filter((_, i) => i !== index)
              .map((t, i) => ({ ...t, orden: i + 1 })),
          },
        })),

      // Firma genérica reutilizable para el resto de pasos (5-9), por ejemplo:
      // updateField("transportista", { nombre: "ACME" })
      // updateField("gastos", { seguro: 150 })
      updateField: (section, patch) =>
        set((state) => {
          const current = state[section];
          return {
            [section]: { ...(current as object), ...patch },
          } as unknown as Partial<DucaFormStore>;
        }),

      addMercancia: (item) =>
        set((state) => ({ mercancias: [...state.mercancias, item] })),

      removeMercancia: (index) =>
        set((state) => ({
          mercancias: state.mercancias.filter((_, i) => i !== index),
        })),

      addEquipamiento: (item) =>
        set((state) => ({ equipamientos: [...state.equipamientos, item] })),

      removeEquipamiento: (index) =>
        set((state) => ({
          equipamientos: state.equipamientos.filter((_, i) => i !== index),
        })),

      addDocumento: (doc) =>
        set((state) => ({
          documentos: [...state.documentos, { ...doc, incluido: true }],
        })),

      toggleDocumento: (id) =>
        set((state) => ({
          documentos: state.documentos.map((d) =>
            d.id === id ? { ...d, incluido: !d.incluido } : d,
          ),
        })),

      removeDocumento: (id) =>
        set((state) => ({
          documentos: state.documentos.filter((d) => d.id !== id),
        })),

      goToStep: (step) => set({ currentStep: step }),

      markStepComplete: (step) =>
        set((state) => ({
          maxStepReached: Math.max(state.maxStepReached, step + 1),
        })),

      hydrateFromExtraction: (data) => set((state) => ({ ...state, ...data })),

      resetForm: () => set({ ...initialState, currentStep: 1, maxStepReached: 1 }),
    }),
    {
      name: "duca-t-form-storage", // clave en localStorage
      storage: createJSONStorage(() => localStorage),
      // Persistimos solo la data del trámite, no acciones
      partialize: (state) => {
        const { currentStep, maxStepReached, ...formData } = state;
        return { currentStep, maxStepReached, ...formData };
      },
    },
  ),
);
