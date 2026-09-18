"use client";

import { useMemo, useState } from "react";
import { FormShell } from "@/components/duca-t/FormShell";
import { StepActions } from "@/components/duca-t/StepActions";
import { SelectField } from "@/components/duca-t/fields/SelectField";
import { TextField } from "@/components/duca-t/fields/TextField";
import { useDucaFormStore } from "@/store/duca-form-store";
import type { MercanciaData } from "@/types/duca";

const CLASES_BULTOS = [{ label: "Caja", value: "Caja" }, { label: "Pallet", value: "Pallet" }];
const PAISES_ORIGEN = [{ label: "Guatemala", value: "Guatemala" }];

const emptyDraft: MercanciaData = {
  numeroMercancia: "",
  descripcion: "",
  bultos: "",
  claseBultos: "",
  paisOrigen: "",
  pesoBruto: "",
};

export default function Paso7MercanciasPage() {
  const mercancias = useDucaFormStore((s) => s.mercancias);
  const addMercancia = useDucaFormStore((s) => s.addMercancia);
  const removeMercancia = useDucaFormStore((s) => s.removeMercancia);
  const gastos = useDucaFormStore((s) => s.gastos);
  const updateField = useDucaFormStore((s) => s.updateField);

  const [draft, setDraft] = useState<MercanciaData>(emptyDraft);

  const valorAduanaTotal = useMemo(() => {
    const transporte = Number(gastos.transporte) || 0;
    const seguro = Number(gastos.seguro) || 0;
    const otros = Number(gastos.otros) || 0;
    const valorTransaccion = Number(gastos.transporte === "" ? 0 : 0); // valor transacción se maneja aparte abajo
    return transporte + seguro + otros + valorTransaccion;
  }, [gastos]);

  const handleAdd = () => {
    if (!draft.descripcion || !draft.bultos) return;
    addMercancia(draft);
    setDraft(emptyDraft);
  };

  const isValid = () => mercancias.length > 0;

  return (
    <FormShell currentStepId={7}>
      <div className="col-span-12 flex flex-col gap-6">
        {/* Formulario para agregar una mercancía */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-outline-variant rounded bg-surface-container-lowest">
          <TextField
            label="Mercancía (partida arancelaria)"
            required
            value={draft.numeroMercancia ?? ""}
            onChange={(v) => setDraft((d) => ({ ...d, numeroMercancia: v }))}
          />
          <TextField
            label="Descripción"
            required
            value={draft.descripcion ?? ""}
            onChange={(v) => setDraft((d) => ({ ...d, descripcion: v }))}
          />
          <TextField
            label="Cantidad de bultos"
            required
            value={String(draft.bultos ?? "")}
            onChange={(v) => setDraft((d) => ({ ...d, bultos: v }))}
          />
          <SelectField
            label="Clase de bultos"
            required
            value={draft.claseBultos ?? ""}
            onChange={(v) => setDraft((d) => ({ ...d, claseBultos: v }))}
            options={CLASES_BULTOS}
          />
          <SelectField
            label="País de origen"
            required
            value={draft.paisOrigen ?? ""}
            onChange={(v) => setDraft((d) => ({ ...d, paisOrigen: v }))}
            options={PAISES_ORIGEN}
          />
          <TextField
            label="Peso bruto (kg)"
            required
            value={String(draft.pesoBruto ?? "")}
            onChange={(v) => setDraft((d) => ({ ...d, pesoBruto: v }))}
          />
          <div className="md:col-span-3 flex justify-end">
            <button
              type="button"
              onClick={handleAdd}
              className="text-secondary hover:underline text-button-text font-button-text"
            >
              + Agregar mercancía
            </button>
          </div>
        </div>

        {/* Tabla de mercancías agregadas */}
        <div className="overflow-x-auto border border-outline-variant rounded">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="p-2 border-r border-outline-variant w-16 text-body-sm">No. línea</th>
                <th className="p-2 border-r border-outline-variant text-body-sm">Mercancía</th>
                <th className="p-2 border-r border-outline-variant w-40 text-body-sm">País de origen</th>
                <th className="p-2 border-r border-outline-variant w-32 text-body-sm">Clase de bultos</th>
                <th className="p-2 border-r border-outline-variant w-24 text-right text-body-sm">No. bultos</th>
                <th className="p-2 text-right w-32 text-body-sm">Peso bruto (kg)</th>
                <th className="p-2 w-12" />
              </tr>
            </thead>
            <tbody>
              {mercancias.map((m, i) => (
                <tr key={i} className="border-t border-outline-variant">
                  <td className="p-2 border-r border-outline-variant text-body-sm">{i + 1}</td>
                  <td className="p-2 border-r border-outline-variant text-body-sm">{m.descripcion}</td>
                  <td className="p-2 border-r border-outline-variant text-body-sm">{m.paisOrigen}</td>
                  <td className="p-2 border-r border-outline-variant text-body-sm">{m.claseBultos}</td>
                  <td className="p-2 border-r border-outline-variant text-body-sm text-right">{m.bultos}</td>
                  <td className="p-2 text-body-sm text-right">{m.pesoBruto}</td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeMercancia(i)}
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

        {/* Gastos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label="Gastos de transporte"
            required
            value={String(gastos.transporte ?? "")}
            onChange={(v) => updateField("gastos", { transporte: v })}
          />
          <TextField
            label="Gastos de seguro"
            value={String(gastos.seguro ?? "")}
            onChange={(v) => updateField("gastos", { seguro: v })}
          />
          <TextField
            label="Otros gastos"
            required
            value={String(gastos.otros ?? "")}
            onChange={(v) => updateField("gastos", { otros: v })}
          />
          <TextField
            label="Valor en aduana total"
            value={String(valorAduanaTotal)}
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
