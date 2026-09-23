"use client";

import { FormShell } from "@/components/duca-t/FormShell";
import { StepActions } from "@/components/duca-t/StepActions";
import { TextField } from "@/components/duca-t/fields/TextField";
import { useDucaFormStore } from "@/store/duca-form-store";

export default function Paso6ConductorPage() {
  const conductor = useDucaFormStore((s) => s.conductor);
  const updateField = useDucaFormStore((s) => s.updateField);

  const isValid = () => Boolean(conductor.LicenciaConductor);

  return (
    <FormShell currentStepId={6}>
      <div className="col-span-12 flex flex-col gap-6">
        <TextField
          label="Licencia"
          required
          value={conductor.LicenciaConductor ?? ""}
          onChange={(v) => updateField("conductor", { LicenciaConductor: v })}
        />

        <div className="w-full border-t border-outline-variant my-6" />
        <StepActions stepId={6} onValidate={isValid} />
      </div>
    </FormShell>
  );
}
