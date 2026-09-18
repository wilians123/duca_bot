"use client";

import { useRouter } from "next/navigation";
import { STEPS } from "@/types/duca";
import { useDucaFormStore } from "@/store/duca-form-store";

interface StepNavigatorProps {
  currentStepId: number;
}

export function StepNavigator({ currentStepId }: StepNavigatorProps) {
  const router = useRouter();
  const maxStepReached = useDucaFormStore((s) => s.maxStepReached);
  const goToStep = useDucaFormStore((s) => s.goToStep);

  const handleClick = (stepId: number, slug: string) => {
    // Solo permite saltar a un paso si ya fue alcanzado/completado antes
    if (stepId > maxStepReached) return;
    goToStep(stepId);
    router.push(`/duca-t/${slug}`);
  };

  return (
    <div className="flex flex-wrap gap-2 mb-8 justify-center max-w-5xl mx-auto">
      {STEPS.map((step) => {
        const isActive = step.id === currentStepId;
        const isUnlocked = step.id <= maxStepReached;

        return (
          <button
            key={step.id}
            type="button"
            disabled={!isUnlocked}
            onClick={() => handleClick(step.id, step.slug)}
            className={[
              "px-4 py-2 text-step-indicator font-step-indicator rounded flex items-center justify-center transition-colors shadow-sm",
              isActive
                ? "bg-primary text-on-primary font-bold cursor-pointer"
                : isUnlocked
                  ? "bg-white border border-outline-variant text-on-surface-variant hover:bg-surface-container-low cursor-pointer"
                  : "bg-surface-container-low border border-outline-variant text-on-surface-variant/50 cursor-not-allowed",
            ].join(" ")}
          >
            {step.label}
          </button>
        );
      })}
    </div>
  );
}
