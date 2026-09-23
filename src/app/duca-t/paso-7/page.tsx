"use client";

import { useState } from "react";
import { FormShell } from "@/components/duca-t/FormShell";
import { StepActions } from "@/components/duca-t/StepActions";
import { SelectField } from "@/components/duca-t/fields/SelectField";
import { TextField } from "@/components/duca-t/fields/TextField";
import { useDucaFormStore } from "@/store/duca-form-store";
import type { GastosData, MercanciaData } from "@/types/duca";

const CLASES_MERCANCIA = [
  { label: "Caja", value: "Caja" },
  { label: "Pallet", value: "Pallet" },
];
const PAISES_MERCANCIA = [{ label: "Guatemala", value: "Guatemala" }];

const emptyDraft: MercanciaData = {
  PartidaArancelaria: "",
  DescripcionMercancia: "",
  CantidadMercancia: "",
  ClaseMercancia: "",
  PaisMercancia: "",
  PesoMercancia: "",
};

export default function Paso7MercanciasPage() {
  const mercancias = useDucaFormStore((s) => s.mercancias);
  const addMercancia = useDucaFormStore((s) => s.addMercancia);
  const removeMercancia = useDucaFormStore((s) => s.removeMercancia);
  const gastos = useDucaFormStore((s) => s.gastos);
  const updateField = useDucaFormStore((s) => s.updateField);
  const [draft, setDraft] = useState<MercanciaData>(emptyDraft);

  const calculateValorTotal = (gastosActuales: GastosData) =>
    (Number(gastosActuales.ValorFOB) || 0) +
    (Number(gastosActuales.GastosTransporte) || 0) +
    (Number(gastosActuales.GastosSeguro) || 0) +
    (Number(gastosActuales.OtrosGastos) || 0);

  const updateGasto = (key: keyof GastosData, value: string) => {
    const next = { ...gastos, [key]: value };
    const ValorTotal = calculateValorTotal(next);
    updateField("gastos", { ...next, ValorTotal });
  };

  const handleAdd = () => {
    if (!draft.DescripcionMercancia || !draft.CantidadMercancia) return;
    addMercancia(draft);
    setDraft(emptyDraft);
  };

  const handleRemove = (index: number) => {
    removeMercancia(index);
  };

  const isValid = () => mercancias.length > 0;

  return (
    <FormShell currentStepId={7}>
      <div className="col-span-12 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-outline-variant rounded bg-surface-container-lowest">
          <div className="md:col-span-2">
            <TextField
              label="Mercancía"
              required
              value={draft.PartidaArancelaria ?? ""}
              onChange={(v) => setDraft((d) => ({ ...d, PartidaArancelaria: v }))}
            />
          </div>
          <div className="md:col-span-2">
            <TextField
              label="Descripción"
              required
              value={draft.DescripcionMercancia ?? ""}
              onChange={(v) => setDraft((d) => ({ ...d, DescripcionMercancia: v }))}
            />
          </div>
          <TextField
            label="Cantidad de bultos"
            required
            value={String(draft.CantidadMercancia ?? "")}
            onChange={(v) => setDraft((d) => ({ ...d, CantidadMercancia: v }))}
          />
          <SelectField
            label="Clase de bultos"
            required
            value={draft.ClaseMercancia ?? ""}
            onChange={(v) => setDraft((d) => ({ ...d, ClaseMercancia: v }))}
            options={CLASES_MERCANCIA}
          />
          <SelectField
            label="País de origen"
            required
            value={draft.PaisMercancia ?? ""}
            onChange={(v) => setDraft((d) => ({ ...d, PaisMercancia: v }))}
            options={PAISES_MERCANCIA}
          />
          <TextField
            label="Peso bruto (kg)"
            required
            value={String(draft.PesoMercancia ?? "")}
            onChange={(v) => setDraft((d) => ({ ...d, PesoMercancia: v }))}
          />
          <div className="md:col-span-4 flex justify-end">
            <button
              type="button"
              onClick={handleAdd}
              className="text-secondary hover:underline text-button-text font-button-text"
            >
              + Agregar mercancía
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-outline-variant rounded">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="p-2 border-r border-outline-variant w-16 text-body-sm">No. línea</th>
                <th className="p-2 border-r border-outline-variant text-body-sm">Mercancía</th>
                <th className="p-2 border-r border-outline-variant w-40 text-body-sm">País de origen</th>
                <th className="p-2 border-r border-outline-variant w-32 text-body-sm">Clase de bultos</th>
                <th className="p-2 border-r border-outline-variant w-24 text-right text-body-sm">Cantidad de bultos</th>
                <th className="p-2 text-right w-32 text-body-sm">Peso bruto (kg)</th>
                <th className="p-2 w-12" />
              </tr>
            </thead>
            <tbody>
              {mercancias.map((mercancia, i) => (
                <tr key={i} className="border-t border-outline-variant">
                  <td className="p-2 border-r border-outline-variant text-body-sm">{i + 1}</td>
                  <td className="p-2 border-r border-outline-variant text-body-sm">{mercancia.DescripcionMercancia}</td>
                  <td className="p-2 border-r border-outline-variant text-body-sm">{mercancia.PaisMercancia}</td>
                  <td className="p-2 border-r border-outline-variant text-body-sm">{mercancia.ClaseMercancia}</td>
                  <td className="p-2 border-r border-outline-variant text-body-sm text-right">{mercancia.CantidadMercancia}</td>
                  <td className="p-2 text-body-sm text-right">{mercancia.PesoMercancia}</td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemove(i)}
                      className="text-error text-body-sm hover:underline"
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
              {mercancias.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-on-surface-variant text-body-sm">
                    Aún no hay mercancías agregadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label="Valor transacción"
            required
            value={String(gastos.ValorFOB ?? "")}
            onChange={(v) => updateGasto("ValorFOB", v)}
          />
          <TextField
            label="Gastos de transporte"
            required
            value={String(gastos.GastosTransporte ?? "")}
            onChange={(v) => updateGasto("GastosTransporte", v)}
          />
          <TextField
            label="Gastos de seguro"
            value={String(gastos.GastosSeguro ?? "")}
            onChange={(v) => updateGasto("GastosSeguro", v)}
          />
          <TextField
            label="Otros Gastos"
            required
            value={String(gastos.OtrosGastos ?? "")}
            onChange={(v) => updateGasto("OtrosGastos", v)}
          />
          <TextField
            label="Valor en aduana total"
            value={String(calculateValorTotal(gastos))}
            onChange={() => {}}
            disabled
          />
        </div>

        <div className="w-full border-t border-outline-variant my-6" />
        <StepActions stepId={7} onValidate={isValid} />
      </div>
    </FormShell>
  );
}
