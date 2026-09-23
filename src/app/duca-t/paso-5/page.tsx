"use client";

import { FormShell } from "@/components/duca-t/FormShell";
import { StepActions } from "@/components/duca-t/StepActions";
import { TextField } from "@/components/duca-t/fields/TextField";
import { useDucaFormStore } from "@/store/duca-form-store";

export default function Paso5TransportistaPage() {
  const transportista = useDucaFormStore((s) => s.transportista);
  const vehiculo = useDucaFormStore((s) => s.vehiculo);
  const updateField = useDucaFormStore((s) => s.updateField);

  const isValid = () => Boolean(transportista.CodigoTransportista && vehiculo.PlacaTransporte);

  return (
    <FormShell currentStepId={5}>
      <div className="col-span-12 flex flex-col gap-6">
        <h3 className="text-label-bold font-label-bold text-on-surface">Transportista</h3>
        <TextField
          label="Código del transportista"
          required
          value={transportista.CodigoTransportista ?? ""}
          onChange={(v) => updateField("transportista", { CodigoTransportista: v })}
        />

        <div className="w-full border-t border-outline-variant" />

        <h3 className="text-label-bold font-label-bold text-on-surface">
          Unidad de transporte
        </h3>
        <TextField
          label="Número de identificación de la unidad de transporte (No. de placa)"
          required
          value={vehiculo.PlacaTransporte ?? ""}
          onChange={(v) => updateField("vehiculo", { PlacaTransporte: v })}
        />

        <div className="w-full border-t border-outline-variant my-6" />
        <StepActions stepId={5} onValidate={isValid} />
      </div>
    </FormShell>
  );
}
