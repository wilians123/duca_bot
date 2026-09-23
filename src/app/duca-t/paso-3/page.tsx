"use client";

import { FormShell } from "@/components/duca-t/FormShell";
import { StepActions } from "@/components/duca-t/StepActions";
import { SelectField } from "@/components/duca-t/fields/SelectField";
import { TextField } from "@/components/duca-t/fields/TextField";
import { useDucaFormStore } from "@/store/duca-form-store";

const TIPOS_DOC_IDENTIFICACION = [
  { label: "Número de Registro Único de Contribuyentes", value: "RUC" },
];
const PAISES_EMISION = [{ label: "Costa Rica", value: "Costa Rica" }];

export default function Paso3ImportadorPage() {
  const importador = useDucaFormStore((s) => s.importador);
  const updateImportador = useDucaFormStore((s) => s.updateImportador);

  const isValid = () =>
    Boolean(
        importador.NombreImportador &&
        importador.DomicilioImportador &&
        importador.TipoIdentificacionImportador &&
        importador.NumeroIdentificacionImportador,
    );

  return (
    <FormShell currentStepId={3}>
      <div className="col-span-12 md:col-span-3 flex flex-col items-center text-center mt-4" />

      <div className="col-span-12 md:col-span-9 flex flex-col gap-6">
        <TextField
          label="Nombre o razón social del importador"
          required
          value={importador.NombreImportador}
          onChange={(v) => updateImportador({ NombreImportador: v })}
        />

        <TextField
          label="Domicilio fiscal del importador"
          required
          value={importador.DomicilioImportador}
          onChange={(v) => updateImportador({ DomicilioImportador: v })}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectField
            label="Tipo de documento de identificación"
            required
            value={importador.TipoIdentificacionImportador}
            onChange={(v) => updateImportador({ TipoIdentificacionImportador: v })}
            options={TIPOS_DOC_IDENTIFICACION}
          />
          <TextField
            label="Número de documento de identificación"
            required
            value={importador.NumeroIdentificacionImportador}
            onChange={(v) => updateImportador({ NumeroIdentificacionImportador: v })}
          />
        </div>

        <SelectField
          label="País de emisión"
          required
          value={importador.PaisImportador}
          onChange={(v) => updateImportador({ PaisImportador: v })}
          options={PAISES_EMISION}
        />

        <div className="w-full border-t border-outline-variant my-6" />
        <StepActions stepId={3} onValidate={isValid} />
      </div>
    </FormShell>
  );
}
