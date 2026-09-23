"use client";

import { useState } from "react";
import { FormShell } from "@/components/duca-t/FormShell";
import { StepActions } from "@/components/duca-t/StepActions";
import { SelectField } from "@/components/duca-t/fields/SelectField";
import { TextField } from "@/components/duca-t/fields/TextField";
import { useDucaFormStore } from "@/store/duca-form-store";
import type { EquipamientoData } from "@/types/duca";

const TIPOS_EQUIPAMIENTO = [
  { label: "Contenedor", value: "Contenedor" },
  { label: "Remolque", value: "Remolque" },
];
const TIPOS_CARGA = [
  { label: "Contenerizada", value: "Contenerizada" },
  { label: "Suelto", value: "Suelto" },
];
const TAMANOS = [
  { label: "45G1", value: "45G1" },
  { label: "20G1", value: "20G1" },
];
const NACIONALIDADES = [
  { label: "El Salvador", value: "El Salvador" },
  { label: "Guatemala", value: "Guatemala" },
  { label: "Honduras", value: "Honduras" },
];

const emptyDraft: EquipamientoData = {
  TipoEquipamiento: "",
  TipoCarga: "",
  PlacaChasis: "",
  MarchamoSat: "",
  TamañoContenedor: "",
  NumeroContenedor: "",
  PaisChasis: "",
};

export default function Paso9EquipamientoPage() {
  const equipamientos = useDucaFormStore((s) => s.equipamientos);
  const addEquipamiento = useDucaFormStore((s) => s.addEquipamiento);
  const removeEquipamiento = useDucaFormStore((s) => s.removeEquipamiento);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<EquipamientoData>(emptyDraft);

  const handleSave = () => {
    if (!draft.TipoEquipamiento || !draft.TipoCarga) return;
    addEquipamiento(draft);
    setDraft(emptyDraft);
    setIsModalOpen(false);
  };

  const isValid = () => equipamientos.length > 0;

  return (
    <FormShell currentStepId={9}>
      <div className="col-span-12 flex flex-col gap-6">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="bg-[#3288C8] hover:bg-[#286b9e] text-white text-button-text font-button-text px-4 py-2 rounded transition-colors shadow-sm"
          >
            + Agregar equipamiento
          </button>
        </div>

        <div className="overflow-x-auto border border-outline-variant rounded">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="p-3 border-b border-r border-outline-variant w-12 text-body-sm">#</th>
                <th className="p-3 border-b border-r border-outline-variant text-body-sm">Equipamiento:</th>
                <th className="p-3 border-b border-r border-outline-variant text-body-sm">Tipo de carga:</th>
                <th className="p-3 border-b border-r border-outline-variant text-body-sm">
                  Identificación del remolque o semiremolque:
                </th>
                <th className="p-3 border-b border-outline-variant w-12 text-center text-body-sm" />
              </tr>
            </thead>
            <tbody>
              {equipamientos.map((equipamiento, i) => (
                <tr key={i} className="border-t border-outline-variant">
                  <td className="p-3 border-r border-outline-variant text-body-sm">{i + 1}</td>
                  <td className="p-3 border-r border-outline-variant text-body-sm">{equipamiento.TipoEquipamiento}</td>
                  <td className="p-3 border-r border-outline-variant text-body-sm">{equipamiento.TipoCarga}</td>
                  <td className="p-3 border-r border-outline-variant text-body-sm">{equipamiento.PlacaChasis}</td>
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => removeEquipamiento(i)}
                      className="text-error text-body-sm hover:underline"
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
              {equipamientos.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-on-surface-variant text-body-sm">
                    Aún no hay equipamiento agregado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="w-full border-t border-outline-variant my-6" />
        <StepActions stepId={9} onValidate={isValid} />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="px-8 py-4 border-b border-outline-variant shrink-0">
              <h3 className="text-label-bold font-label-bold text-on-surface">
                Agregar equipamiento
              </h3>
            </div>

            <form className="px-8 py-6 flex flex-col gap-4 overflow-y-auto">
              <SelectField
                label="Equipamiento:"
                required
                value={draft.TipoEquipamiento}
                onChange={(v) => setDraft((d) => ({ ...d, TipoEquipamiento: v }))}
                options={TIPOS_EQUIPAMIENTO}
              />
              <SelectField
                label="Tipo de carga:"
                required
                value={draft.TipoCarga}
                onChange={(v) => setDraft((d) => ({ ...d, TipoCarga: v }))}
                options={TIPOS_CARGA}
              />
              <TextField
                label="Identificación del remolque o semiremolque:"
                value={draft.PlacaChasis}
                onChange={(v) => setDraft((d) => ({ ...d, PlacaChasis: v }))}
              />
              <TextField
                label="Número de dispositivo de seguridad:"
                value={draft.MarchamoSat}
                onChange={(v) => setDraft((d) => ({ ...d, MarchamoSat: v }))}
                helperText="(Si la unidad de transporte puede ser precintada, el número de dispositivo de seguridad es requerido o puede ser consignado por la autoridad aduanera en la aduana de partida)"
              />
              <SelectField
                label="Tamaño del equipamiento:"
                required
                value={draft.TamañoContenedor}
                onChange={(v) => setDraft((d) => ({ ...d, TamañoContenedor: v }))}
                options={TAMANOS}
              />
              <TextField
                label="Número de identificación del contenedor:"
                required
                value={draft.NumeroContenedor}
                onChange={(v) => setDraft((d) => ({ ...d, NumeroContenedor: v }))}
                helperText="(Si su carga es contenerizada, debe ingresar este campo)"
              />
              <SelectField
                label="Nacionalidad del remolque o semirremolque:"
                value={draft.PaisChasis}
                onChange={(v) => setDraft((d) => ({ ...d, PaisChasis: v }))}
                options={NACIONALIDADES}
              />
            </form>

            <div className="px-8 py-4 bg-surface-container-lowest flex justify-end gap-4 shrink-0">
              <button
                type="button"
                onClick={handleSave}
                className="text-button-text font-button-text text-secondary hover:text-primary hover:underline"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-button-text font-button-text text-secondary hover:text-primary hover:underline"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </FormShell>
  );
}
