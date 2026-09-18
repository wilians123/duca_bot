"use client";

import { FormShell } from "@/components/duca-t/FormShell";
import { StepActions } from "@/components/duca-t/StepActions";
import { TextField } from "@/components/duca-t/fields/TextField";
import { useDucaFormStore } from "@/store/duca-form-store";

export default function Paso5TransportistaPage() {
  const transportista = useDucaFormStore((s) => s.transportista);
  const vehiculo = useDucaFormStore((s) => s.vehiculo);
  const updateField = useDucaFormStore((s) => s.updateField);

  const isValid = () =>
    Boolean(transportista.codigo && transportista.nombre && vehiculo.numeroPlaca && vehiculo.marca);

  return (
    <FormShell currentStepId={5}>
      <div className="col-span-12 flex flex-col gap-6">
        <h3 className="text-label-bold font-label-bold text-on-surface">Transportista</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextField
            label="Código del transportista"
            required
            value={transportista.codigo ?? ""}
            onChange={(v) => updateField("transportista", { codigo: v })}
          />
          <TextField
            label="Nombre del transportista"
            required
            value={transportista.nombre ?? ""}
            onChange={(v) => updateField("transportista", { nombre: v })}
          />
        </div>
        <TextField
          label="Dirección"
          value={transportista.direccion ?? ""}
          onChange={(v) => updateField("transportista", { direccion: v })}
        />

        <div className="w-full border-t border-outline-variant" />

        <h3 className="text-label-bold font-label-bold text-on-surface">
          Unidad de transporte
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextField
            label="Número de identificación de la unidad de transporte (No. de placa)"
            required
            value={vehiculo.numeroPlaca ?? ""}
            onChange={(v) => updateField("vehiculo", { numeroPlaca: v })}
          />
          <TextField
            label="Marca"
            required
            value={vehiculo.marca ?? ""}
            onChange={(v) => updateField("vehiculo", { marca: v })}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextField
            label="Modelo"
            value={vehiculo.modelo ?? ""}
            onChange={(v) => updateField("vehiculo", { modelo: v })}
          />
          <TextField
            label="Número de chasis / VIN"
            required
            value={vehiculo.numeroChasisVin ?? ""}
            onChange={(v) => updateField("vehiculo", { numeroChasisVin: v })}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextField
            label="Número de motor"
            value={vehiculo.numeroMotor ?? ""}
            onChange={(v) => updateField("vehiculo", { numeroMotor: v })}
          />
          <TextField
            label="País de registro"
            required
            value={vehiculo.paisRegistro ?? ""}
            onChange={(v) => updateField("vehiculo", { paisRegistro: v })}
          />
        </div>

        <div className="w-full border-t border-outline-variant my-6" />
        <StepActions stepId={5} onValidate={isValid} />
      </div>
    </FormShell>
  );
}
