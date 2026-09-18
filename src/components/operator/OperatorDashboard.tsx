"use client";

import OriginalExtractionView from "@/app/page";

export function OperatorDashboard() {
  return <div className="min-h-screen bg-[#f5f8fc]"><header className="border-b border-[#dbe5ef] bg-white px-5 py-6 sm:px-8 lg:px-10"><div className="mx-auto flex max-w-[1400px] flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#147b94]">Principal</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#10233f]">Centro de operación</h1><p className="mt-2 text-sm leading-6 text-slate-600">Conecta Gmail, ejecuta la extracción y valida cada declaración desde un solo espacio.</p></div><div className="flex items-center gap-2 text-xs font-semibold text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Sesión operativa activa</div></div></header><div className="mx-auto max-w-[1400px] px-0"><OriginalExtractionView /></div></div>;
}
