"use client";

import { FormShell } from "@/components/duca-t/FormShell";
import { StepActions } from "@/components/duca-t/StepActions";
import { SelectField } from "@/components/duca-t/fields/SelectField";
import { TextField } from "@/components/duca-t/fields/TextField";
import { useDucaFormStore } from "@/store/duca-form-store";

const TIPOS_DOC_IDENTIFICACION = [
  { label: "Número de Registro Único de Contribuyentes", value: "RUC" },
];
const PAISES_EMISION = [{ label: "Mexico", value: "Mexico" }];

export default function Paso2ExportadorPage() {
  const exportador = useDucaFormStore((s) => s.exportador);
  const updateExportador = useDucaFormStore((s) => s.updateExportador);

  const isValid = () => Boolean(exportador.NombreExportador && exportador.DomicilioExportador);

  return (
    <FormShell currentStepId={2}>
      <div className="col-span-12 md:col-span-3 flex flex-col items-center text-center mt-4" />

      <div className="col-span-12 md:col-span-9 flex flex-col gap-6">
        <TextField
          label="Nombre o razón social del exportador"
          required
          value={exportador.NombreExportador}
          onChange={(v) => updateExportador({ NombreExportador: v })}
        />

        <TextField
          label="Domicilio fiscal del exportador"
          required
          value={exportador.DomicilioExportador}
          onChange={(v) => updateExportador({ DomicilioExportador: v })}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectField
            label="Tipo de documento de identificación"
            value={exportador.TipoIdentificacionExportador}
            onChange={(v) => updateExportador({ TipoIdentificacionExportador: v })}
            options={TIPOS_DOC_IDENTIFICACION}
          />
          <TextField
            label="Número de documento de identificación"
            value={exportador.NumeroIdentificacionExportador}
            onChange={(v) => updateExportador({ NumeroIdentificacionExportador: v })}
          />
        </div>

        <SelectField
          label="País de emisión"
          value={exportador.PaisExportador}
          onChange={(v) => updateExportador({ PaisExportador: v })}
          options={PAISES_EMISION}
        />

        <div className="w-full border-t border-outline-variant my-6" />
        <StepActions stepId={2} onValidate={isValid} />
      </div>
    </FormShell>
  );
}
