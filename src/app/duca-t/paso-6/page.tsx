"use client";

import { FormShell } from "@/components/duca-t/FormShell";
import { StepActions } from "@/components/duca-t/StepActions";
import { SelectField } from "@/components/duca-t/fields/SelectField";
import { TextField } from "@/components/duca-t/fields/TextField";
import { useDucaFormStore } from "@/store/duca-form-store";

const TIPOS_DOC_ID = [
  { label: "Documento Personal de Identificación", value: "DUI" },
];
const PAISES = [
  { label: "El Salvador", value: "El Salvador" },
  { label: "Guatemala", value: "Guatemala" },
  { label: "Honduras", value: "Honduras" },
];

export default function Paso6ConductorPage() {
  const conductor = useDucaFormStore((s) => s.conductor);
  const updateField = useDucaFormStore((s) => s.updateField);

  const isValid = () =>
    Boolean(
      conductor.primerNombre &&
        conductor.primerApellido &&
        conductor.tipoDocumentoIdentificacion &&
        conductor.numeroDocumentoIdentificacion &&
        conductor.paisExpedicionDocumento &&
        conductor.numeroLicencia &&
        conductor.paisEmisionLicencia &&
        conductor.fechaNacimiento,
    );

  return (
    <FormShell currentStepId={6}>
      <div className="col-span-12 flex flex-col gap-6">
        <TextField
          label="Código del conductor"
          placeholder="Código del conductor"
          value={conductor.codigo ?? ""}
          onChange={(v) => updateField("conductor", { codigo: v })}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextField
            label="Primer nombre"
            required
            value={conductor.primerNombre ?? ""}
            onChange={(v) => updateField("conductor", { primerNombre: v })}
          />
          <TextField
            label="Segundo nombre"
            value={conductor.segundoNombre ?? ""}
            onChange={(v) => updateField("conductor", { segundoNombre: v })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextField
            label="Primer apellido"
            required
            value={conductor.primerApellido ?? ""}
            onChange={(v) => updateField("conductor", { primerApellido: v })}
          />
          <TextField
            label="Segundo apellido"
            value={conductor.segundoApellido ?? ""}
            onChange={(v) => updateField("conductor", { segundoApellido: v })}
          />
        </div>

        <div className="w-full border-t border-outline-variant" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectField
            label="Tipo de documento de identificación"
            required
            value={conductor.tipoDocumentoIdentificacion ?? ""}
            onChange={(v) => updateField("conductor", { tipoDocumentoIdentificacion: v })}
            options={TIPOS_DOC_ID}
          />
          <TextField
            label="Número de documento de identificación"
            required
            value={conductor.numeroDocumentoIdentificacion ?? ""}
            onChange={(v) => updateField("conductor", { numeroDocumentoIdentificacion: v })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextField
            label="Fecha de vencimiento del documento de identificación"
            value={conductor.fechaVencimientoDocumento ?? ""}
            onChange={(v) => updateField("conductor", { fechaVencimientoDocumento: v })}
            placeholder="AAAA-MM-DD"
          />
          <SelectField
            label="País de expedición del documento"
            required
            value={conductor.paisExpedicionDocumento ?? ""}
            onChange={(v) => updateField("conductor", { paisExpedicionDocumento: v })}
            options={PAISES}
          />
        </div>

        <div className="w-full border-t border-outline-variant" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextField
            label="Número del pasaporte"
            value={conductor.numeroPasaporte ?? ""}
            onChange={(v) => updateField("conductor", { numeroPasaporte: v })}
          />
          <TextField
            label="Fecha de vencimiento del pasaporte"
            value={conductor.fechaVencimientoPasaporte ?? ""}
            onChange={(v) => updateField("conductor", { fechaVencimientoPasaporte: v })}
            placeholder="AAAA-MM-DD"
          />
        </div>
        <SelectField
          label="País de emisión del pasaporte"
          value={conductor.paisEmisionPasaporte ?? ""}
          onChange={(v) => updateField("conductor", { paisEmisionPasaporte: v })}
          options={PAISES}
        />

        <div className="w-full border-t border-outline-variant" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextField
            label="Número de licencia"
            required
            value={conductor.numeroLicencia ?? ""}
            onChange={(v) => updateField("conductor", { numeroLicencia: v })}
          />
          <SelectField
            label="País de emisión de la licencia"
            required
            value={conductor.paisEmisionLicencia ?? ""}
            onChange={(v) => updateField("conductor", { paisEmisionLicencia: v })}
            options={PAISES}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextField
            label="Fecha de nacimiento"
            required
            value={conductor.fechaNacimiento ?? ""}
            onChange={(v) => updateField("conductor", { fechaNacimiento: v })}
            placeholder="AAAA-MM-DD"
          />
          <SelectField
            label="País de nacimiento"
            value={conductor.paisNacimiento ?? ""}
            onChange={(v) => updateField("conductor", { paisNacimiento: v })}
            options={PAISES}
          />
        </div>

        <div className="w-full border-t border-outline-variant my-6" />
        <StepActions stepId={6} onValidate={isValid} />
      </div>
    </FormShell>
  );
}
