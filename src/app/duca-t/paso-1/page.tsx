"use client";

import { FormShell } from "@/components/duca-t/FormShell";
import { StepActions } from "@/components/duca-t/StepActions";
import { SelectField } from "@/components/duca-t/fields/SelectField";
import { TextareaField } from "@/components/duca-t/fields/TextareaField";
import { useDucaFormStore } from "@/store/duca-form-store";

// TODO: reemplazar por catálogos reales (API SIECA / tabla de aduanas)
const PAISES = [
  { label: "Guatemala", value: "Guatemala" },
  { label: "El Salvador", value: "El Salvador" },
  { label: "Honduras", value: "Honduras" },
  { label: "Costa Rica", value: "Costa Rica" },
  { label: "Nicaragua", value: "Nicaragua" },
];

const ADUANAS_INICIO = [
  { label: "ADUANA TECUN UMAN - TU - Aduana Frontera", value: "TU" },
];

const ADUANAS_DESTINO = [
  { label: "ADUANA DE PEÑAS BLANCAS - 003 - Aduana Frontera", value: "003" },
];

export default function Paso1RutaPage() {
  const ruta = useDucaFormStore((s) => s.ruta);
  const updateRuta = useDucaFormStore((s) => s.updateRuta);

  const isValid = () => {
    // Validación mínima de campos requeridos (marcados con * en el HTML original)
    return Boolean(ruta.PaisProcedencia && ruta.AduanaInicio && ruta.PaisDestino && ruta.AduanaDestino);
  };

  return (
    <FormShell currentStepId={1}>
      {/* Panel lateral izquierdo (info) */}
      <div className="col-span-12 md:col-span-3 flex flex-col items-center text-center mt-4" />

      {/* Formulario */}
      <div className="col-span-12 md:col-span-9 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectField
            label="País de procedencia"
            required
            value={ruta.PaisProcedencia}
            onChange={(v) => updateRuta({ PaisProcedencia: v })}
            options={PAISES}
          />
          <SelectField
            label="Aduana de inicio"
            required
            value={ruta.AduanaInicio}
            onChange={(v) => updateRuta({ AduanaInicio: v })}
            options={ADUANAS_INICIO}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectField
            label="País de destino"
            required
            value={ruta.PaisDestino}
            onChange={(v) => updateRuta({ PaisDestino: v })}
            options={PAISES}
          />
          <SelectField
            label="Aduana de destino"
            required
            value={ruta.AduanaDestino}
            onChange={(v) => updateRuta({ AduanaDestino: v })}
            options={ADUANAS_DESTINO}
          />
        </div>

        <TextareaField
          label="Observaciones (máx. 1500 caracteres)"
          value={ruta.Observaciones}
          onChange={(v) => updateRuta({ Observaciones: v })}
        />

        <div className="w-full border-t border-outline-variant my-6" />
        <StepActions stepId={1} onValidate={isValid} />
      </div>
    </FormShell>
  );
}
