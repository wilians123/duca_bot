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
    return Boolean(ruta.paisProcedencia && ruta.aduanaInicio && ruta.paisDestino && ruta.aduanaDestino);
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
            value={ruta.paisProcedencia}
            onChange={(v) => updateRuta({ paisProcedencia: v })}
            options={PAISES}
          />
          <SelectField
            label="Aduana de inicio"
            required
            value={ruta.aduanaInicio}
            onChange={(v) => updateRuta({ aduanaInicio: v })}
            options={ADUANAS_INICIO}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectField
            label="Depósito de origen"
            value={ruta.depositoOrigen}
            onChange={(v) => updateRuta({ depositoOrigen: v })}
            options={[]}
            infoTooltip="Información sobre depósito"
          />
          <SelectField
            label="Lugar de embarque"
            value={ruta.lugarEmbarque}
            onChange={(v) => updateRuta({ lugarEmbarque: v })}
            options={[]}
            infoTooltip="Información sobre lugar de embarque"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectField
            label="País de destino"
            required
            value={ruta.paisDestino}
            onChange={(v) => updateRuta({ paisDestino: v })}
            options={PAISES}
          />
          <SelectField
            label="Aduana de destino"
            required
            value={ruta.aduanaDestino}
            onChange={(v) => updateRuta({ aduanaDestino: v })}
            options={ADUANAS_DESTINO}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectField
            label="Depósito de destino"
            value={ruta.depositoDestino}
            onChange={(v) => updateRuta({ depositoDestino: v })}
            options={[]}
          />
          <SelectField
            label="Lugar de desembarque"
            value={ruta.lugarDesembarque}
            onChange={(v) => updateRuta({ lugarDesembarque: v })}
            options={[]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Régimen aduanero y modo de transporte son fijos por diseño de
              negocio (siempre "Transito internacional" / "Transporte
              terrestre"), por eso quedan deshabilitados intencionalmente,
              a diferencia de los demás campos que sí se liberaron. */}
          <SelectField
            label="Régimen aduanero"
            required
            value={ruta.regimenAduanero}
            onChange={() => {}}
            options={[{ label: "Transito internacional", value: "Transito internacional" }]}
            disabled
          />
          <SelectField
            label="Modo de transporte"
            required
            value={ruta.modoTransporte}
            onChange={() => {}}
            options={[{ label: "Transporte terrestre", value: "Transporte terrestre" }]}
            disabled
          />
        </div>

        <TextareaField
          label="Observaciones"
          value={ruta.observaciones}
          onChange={(v) => updateRuta({ observaciones: v })}
        />

        <div className="w-full border-t border-outline-variant my-6" />
        <StepActions stepId={1} onValidate={isValid} />
      </div>
    </FormShell>
  );
}
