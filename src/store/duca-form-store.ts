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
  DocumentoSoporte,
} from "@/types/duca";

const initialState: DucaFormState = {
  ruta: {
    PaisProcedencia: "",
    AduanaInicio: "",
    PaisDestino: "",
    AduanaDestino: "",
    Observaciones: "",
  },
  exportador: {
    NombreExportador: "",
    DomicilioExportador: "",
    TipoIdentificacionExportador: "",
    NumeroIdentificacionExportador: "",
    PaisExportador: "",
  },
  importador: {
    NombreImportador: "",
    DomicilioImportador: "",
    TipoIdentificacionImportador: "",
    NumeroIdentificacionImportador: "",
    PaisImportador: "",
  },
  rutaTransito: { tramos: [] },
  transportista: {},
  conductor: {},
  vehiculo: {},
  gastos: { ValorFOB: "", GastosTransporte: 1, GastosSeguro: 1, OtrosGastos: 0, ValorTotal: 2 },
  mercancias: [],
  equipamientos: [],
  documentos: [],
};

interface DucaFormActions {
  updateRuta: (patch: Partial<RutaData>) => void;
  updateExportador: (patch: Partial<ExportadorData>) => void;
  updateImportador: (patch: Partial<ImportadorData>) => void;
  updateRutaTransito: (patch: Partial<RutaTransitoData>) => void;
  addTramoRuta: (tramo: Omit<TramoRutaTransito, "orden">) => void;
  updateTramoRuta: (index: number, patch: Partial<TramoRutaTransito>) => void;
  removeTramoRuta: (index: number) => void;
  updateField: <K extends keyof DucaFormState>(
    section: K,
    patch: Partial<DucaFormState[K]>,
  ) => void;
  addMercancia: (item: MercanciaData) => void;
  removeMercancia: (index: number) => void;
  addEquipamiento: (item: EquipamientoData) => void;
  removeEquipamiento: (index: number) => void;
  addDocumento: (doc: DocumentoSoporte) => void;
  updateDocumento: (id: string, patch: Partial<DocumentoSoporte>) => void;
  toggleDocumento: (id: string) => void;
  removeDocumento: (id: string) => void;
  currentStep: number;
  maxStepReached: number;
  goToStep: (step: number) => void;
  markStepComplete: (step: number) => void;
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
      updateRuta: (patch) => set((state) => ({ ruta: { ...state.ruta, ...patch } })),
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
            tramos: state.rutaTransito.tramos.map((tramo, i) =>
              i === index ? { ...tramo, ...patch } : tramo,
            ),
          },
        })),
      removeTramoRuta: (index) =>
        set((state) => ({
          rutaTransito: {
            tramos: state.rutaTransito.tramos
              .filter((_, i) => i !== index)
              .map((tramo, i) => ({ ...tramo, orden: i + 1 })),
          },
        })),
      updateField: (section, patch) =>
        set((state) => ({
          [section]: { ...(state[section] as object), ...patch },
        }) as unknown as Partial<DucaFormStore>),
      addMercancia: (item) => set((state) => ({ mercancias: [...state.mercancias, item] })),
      removeMercancia: (index) =>
        set((state) => ({ mercancias: state.mercancias.filter((_, i) => i !== index) })),
      addEquipamiento: (item) =>
        set((state) => ({ equipamientos: [...state.equipamientos, item] })),
      removeEquipamiento: (index) =>
        set((state) => ({ equipamientos: state.equipamientos.filter((_, i) => i !== index) })),
      addDocumento: (doc) =>
        set((state) => ({ documentos: [...state.documentos, { ...doc, incluido: true }] })),
      updateDocumento: (id, patch) =>
        set((state) => ({
          documentos: state.documentos.map((doc) =>
            doc.id === id ? { ...doc, ...patch } : doc,
          ),
        })),
      toggleDocumento: (id) =>
        set((state) => ({
          documentos: state.documentos.map((doc) =>
            doc.id === id ? { ...doc, incluido: !doc.incluido } : doc,
          ),
        })),
      removeDocumento: (id) =>
        set((state) => ({ documentos: state.documentos.filter((doc) => doc.id !== id) })),
      goToStep: (step) => set({ currentStep: step }),
      markStepComplete: (step) =>
        set((state) => ({ maxStepReached: Math.max(state.maxStepReached, step + 1) })),
      hydrateFromExtraction: (data) => set((state) => ({ ...state, ...data })),
      resetForm: () => set({ ...initialState, currentStep: 1, maxStepReached: 1 }),
    }),
    {
      name: "duca-t-form-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        const { currentStep, maxStepReached, ...formData } = state;
        return { currentStep, maxStepReached, ...formData };
      },
    },
  ),
);
