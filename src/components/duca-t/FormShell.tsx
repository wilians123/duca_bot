"use client";

import { ReactNode } from "react";
import { DucaHeader } from "./Header";
import { StepNavigator } from "./StepNavigator";

interface FormShellProps {
  currentStepId: number;
  children: ReactNode;
}

/**
 * Layout compartido por los 9 pasos del DUCA-T.
 * - Header y StepNavigator permanecen fijos arriba (shrink-0).
 * - El área del formulario (children) es la única zona con scroll interno
 *   (overflow-y-auto) cuando el contenido excede el viewport.
 */
export function FormShell({ currentStepId, children }: FormShellProps) {
  return (
    <div className="bg-background text-on-background h-screen flex flex-col">
      <DucaHeader />
      <div className="flex flex-1 max-w-7xl mx-auto w-full overflow-hidden">
        <main className="flex-1 px-gutter py-container-margin w-full flex flex-col gap-6 overflow-y-auto">
          <StepNavigator currentStepId={currentStepId} />
          <div className="grid grid-cols-12 gap-8 max-w-5xl mx-auto w-full pb-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
