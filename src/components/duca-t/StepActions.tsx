"use client";

import { useRouter } from "next/navigation";
import { STEPS } from "@/types/duca";
import { useDucaFormStore } from "@/store/duca-form-store";

interface StepActionsProps {
  stepId: number;
  /** Validación opcional antes de avanzar. Devuelve true si puede avanzar. */
  onValidate?: () => boolean;
}

export function StepActions({ stepId, onValidate }: StepActionsProps) {
  const router = useRouter();
  const goToStep = useDucaFormStore((s) => s.goToStep);
  const markStepComplete = useDucaFormStore((s) => s.markStepComplete);

  const prevStep = STEPS.find((s) => s.id === stepId - 1);
  const nextStep = STEPS.find((s) => s.id === stepId + 1);

  const handlePrev = () => {
    if (!prevStep) return;
    goToStep(prevStep.id);
    router.push(`/duca-t/${prevStep.slug}`);
  };

  const handleNext = () => {
    if (onValidate && !onValidate()) return;
    markStepComplete(stepId);
    if (nextStep) {
      goToStep(nextStep.id);
      router.push(`/duca-t/${nextStep.slug}`);
    }
  };

  return (
    <div className="flex justify-between w-full">
      <button
        type="button"
        onClick={handlePrev}
        disabled={!prevStep}
        className="text-button-text font-button-text text-secondary hover:underline underline-offset-2 disabled:opacity-0 disabled:pointer-events-none"
      >
        Anterior
      </button>
      <button
        type="button"
        onClick={handleNext}
        className="bg-[#3288C8] hover:bg-[#286b9e] text-white text-button-text font-button-text px-6 py-2 rounded transition-colors shadow-sm"
      >
        {nextStep ? "Siguiente" : "Finalizar"}
      </button>
    </div>
  );
}
