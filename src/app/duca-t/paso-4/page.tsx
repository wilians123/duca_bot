"use client";

import { useState } from "react";
import { FormShell } from "@/components/duca-t/FormShell";
import { StepActions } from "@/components/duca-t/StepActions";
import { useDucaFormStore } from "@/store/duca-form-store";

export default function Paso4RutaTransitoPage() {
  const tramos = useDucaFormStore((s) => s.rutaTransito.tramos);
  const addTramoRuta = useDucaFormStore((s) => s.addTramoRuta);
  const updateTramoRuta = useDucaFormStore((s) => s.updateTramoRuta);
  const removeTramoRuta = useDucaFormStore((s) => s.removeTramoRuta);

  const [draft, setDraft] = useState({ pais: "", aduanaInicio: "", aduanaPaso: "" });

  const handleAdd = () => {
    if (!draft.pais || !draft.aduanaInicio || !draft.aduanaPaso) return;
    addTramoRuta(draft);
    setDraft({ pais: "", aduanaInicio: "", aduanaPaso: "" });
  };

  const isValid = () => tramos.length > 0;

  return (
    <FormShell currentStepId={4}>
      <div className="col-span-12 flex flex-col gap-6">
        <div className="overflow-x-auto border border-outline-variant rounded">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="p-3 text-table-header font-table-header text-on-surface w-16 text-center">
                  Orden
                </th>
                <th className="p-3 text-table-header font-table-header text-on-surface border-l border-outline-variant">
                  País
                </th>
                <th className="p-3 text-table-header font-table-header text-on-surface border-l border-outline-variant">
                  Aduana de inicio
                </th>
                <th className="p-3 text-table-header font-table-header text-on-surface border-l border-outline-variant">
                  Aduana de paso
                </th>
                <th className="p-3 w-16" />
              </tr>
            </thead>
            <tbody>
              {tramos.map((tramo, index) => (
                <tr key={index} className="border-t border-outline-variant">
                  <td className="p-3 text-body-md text-on-surface text-center">{tramo.orden}</td>
                  <td className="p-3 border-l border-outline-variant">
                    <input
                      className="w-full h-9 border border-outline-variant rounded bg-white px-2 text-body-md"
                      value={tramo.pais}
                      onChange={(e) => updateTramoRuta(index, { pais: e.target.value })}
                    />
                  </td>
                  <td className="p-3 border-l border-outline-variant">
                    <input
                      className="w-full h-9 border border-outline-variant rounded bg-white px-2 text-body-md"
                      value={tramo.aduanaInicio}
                      onChange={(e) => updateTramoRuta(index, { aduanaInicio: e.target.value })}
                    />
                  </td>
                  <td className="p-3 border-l border-outline-variant">
                    <input
                      className="w-full h-9 border border-outline-variant rounded bg-white px-2 text-body-md"
                      value={tramo.aduanaPaso}
                      onChange={(e) => updateTramoRuta(index, { aduanaPaso: e.target.value })}
                    />
                  </td>
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => removeTramoRuta(index)}
                      className="text-error hover:underline text-body-sm"
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}

              {/* Fila para agregar un nuevo tramo */}
              <tr className="border-t border-outline-variant bg-surface-container-lowest">
                <td className="p-3 text-center text-on-surface-variant text-body-sm">
                  {tramos.length + 1}
                </td>
                <td className="p-3 border-l border-outline-variant">
                  <input
                    className="w-full h-9 border border-outline-variant rounded bg-white px-2 text-body-md"
                    placeholder="País"
                    value={draft.pais}
                    onChange={(e) => setDraft((d) => ({ ...d, pais: e.target.value }))}
                  />
                </td>
                <td className="p-3 border-l border-outline-variant">
                  <input
                    className="w-full h-9 border border-outline-variant rounded bg-white px-2 text-body-md"
                    placeholder="Aduana de inicio"
                    value={draft.aduanaInicio}
                    onChange={(e) => setDraft((d) => ({ ...d, aduanaInicio: e.target.value }))}
                  />
                </td>
                <td className="p-3 border-l border-outline-variant">
                  <input
                    className="w-full h-9 border border-outline-variant rounded bg-white px-2 text-body-md"
                    placeholder="Aduana de paso"
                    value={draft.aduanaPaso}
                    onChange={(e) => setDraft((d) => ({ ...d, aduanaPaso: e.target.value }))}
                  />
                </td>
                <td className="p-3 text-center">
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="text-secondary hover:underline text-body-sm"
                  >
                    Agregar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="w-full border-t border-outline-variant my-6" />
        <StepActions stepId={4} onValidate={isValid} />
      </div>
    </FormShell>
  );
}
