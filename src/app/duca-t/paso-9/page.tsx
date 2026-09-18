"use client";

import { useState } from "react";
import { FormShell } from "@/components/duca-t/FormShell";
import { StepActions } from "@/components/duca-t/StepActions";
import { SelectField } from "@/components/duca-t/fields/SelectField";
import { TextField } from "@/components/duca-t/fields/TextField";
import { useDucaFormStore } from "@/store/duca-form-store";
import type { EquipamientoData } from "@/types/duca";

const TIPOS_EQUIPO = [
  { label: "Contenedor", value: "Contenedor" },
  { label: "Remolque", value: "Remolque" },
];
const TIPOS_CARGA = [
  { label: "Contenerizada", value: "Contenerizada" },
  { label: "Suelto", value: "Suelto" },
];
const TIPOS_CONTENEDOR = [
  { label: "Contenedor high-cube", value: "high-cube" },
  { label: "Contenedor estándar", value: "estandar" },
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
  tipoEquipo: "",
  tipoCarga: "",
  identificacionRemolque: "",
  numeroDispositivoSeguridad: "",
  tipoContenedor: "",
  tamanoEquipamiento: "",
  numeroIdentificacionContenedor: "",
  nacionalidadRemolque: "",
};

export default function Paso9EquipamientoPage() {
  const equipamientos = useDucaFormStore((s) => s.equipamientos);
  const addEquipamiento = useDucaFormStore((s) => s.addEquipamiento);
  const removeEquipamiento = useDucaFormStore((s) => s.removeEquipamiento);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<EquipamientoData>(emptyDraft);

  const handleSave = () => {
    if (!draft.tipoEquipo || !draft.tipoCarga) return;
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
                <th className="p-3 border-b border-r border-outline-variant text-body-sm">Equipamiento</th>
                <th className="p-3 border-b border-r border-outline-variant text-body-sm">Tipo de carga</th>
                <th className="p-3 border-b border-r border-outline-variant text-body-sm">
                  Identificación del remolque
                </th>
                <th className="p-3 border-b border-r border-outline-variant text-body-sm">
                  Tipo de contenedor
                </th>
                <th className="p-3 border-b border-outline-variant w-12 text-center text-body-sm" />
              </tr>
            </thead>
            <tbody>
              {equipamientos.map((eq, i) => (
                <tr key={i} className="border-t border-outline-variant">
                  <td className="p-3 border-r border-outline-variant text-body-sm">{i + 1}</td>
                  <td className="p-3 border-r border-outline-variant text-body-sm">{eq.tipoEquipo}</td>
                  <td className="p-3 border-r border-outline-variant text-body-sm">{eq.tipoCarga}</td>
                  <td className="p-3 border-r border-outline-variant text-body-sm">
                    {eq.identificacionRemolque}
                  </td>
                  <td className="p-3 border-r border-outline-variant text-body-sm">{eq.tipoContenedor}</td>
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
                  <td colSpan={6} className="p-4 text-center text-on-surface-variant text-body-sm">
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

      {/* Modal: Agregar remolque/contenedor */}
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
                label="Equipamiento"
                required
                value={draft.tipoEquipo}
                onChange={(v) => setDraft((d) => ({ ...d, tipoEquipo: v }))}
                options={TIPOS_EQUIPO}
              />
              <SelectField
                label="Tipo de carga"
                required
                value={draft.tipoCarga}
                onChange={(v) => setDraft((d) => ({ ...d, tipoCarga: v }))}
                options={TIPOS_CARGA}
              />
              <TextField
                label="Identificación del remolque o semiremolque"
                value={draft.identificacionRemolque}
                onChange={(v) => setDraft((d) => ({ ...d, identificacionRemolque: v }))}
              />
              <TextField
                label="Número de dispositivo de seguridad"
                value={draft.numeroDispositivoSeguridad}
                onChange={(v) => setDraft((d) => ({ ...d, numeroDispositivoSeguridad: v }))}
                helperText="(Si la unidad de transporte puede ser precintada, el número de dispositivo de seguridad es requerido o puede ser consignado por la autoridad aduanera en la aduana de partida)"
              />
              <SelectField
                label="Tipo de contenedor"
                required
                value={draft.tipoContenedor}
                onChange={(v) => setDraft((d) => ({ ...d, tipoContenedor: v }))}
                options={TIPOS_CONTENEDOR}
              />
              <SelectField
                label="Tamaño del equipamiento"
                required
                value={draft.tamanoEquipamiento}
                onChange={(v) => setDraft((d) => ({ ...d, tamanoEquipamiento: v }))}
                options={TAMANOS}
              />
              <TextField
                label="Número de identificación del contenedor"
                required
                value={draft.numeroIdentificacionContenedor}
                onChange={(v) => setDraft((d) => ({ ...d, numeroIdentificacionContenedor: v }))}
                helperText="(Si su carga es contenerizada, debe ingresar este campo)"
              />
              <SelectField
                label="Nacionalidad del remolque o semirremolque"
                value={draft.nacionalidadRemolque}
                onChange={(v) => setDraft((d) => ({ ...d, nacionalidadRemolque: v }))}
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
