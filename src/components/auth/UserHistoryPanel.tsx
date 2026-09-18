"use client";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../../firebase/client";
import type { UserProfile } from "@/types/auth";

type HistoryItem = { id: string; reference?: string; status?: "Pendiente" | "Completado" | "Error"; createdAt?: string };

const statusClasses: Record<string, string> = {
  Pendiente: "bg-amber-50 text-amber-700 ring-amber-200",
  Completado: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Error: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function UserHistoryPanel({ profile }: { profile: UserProfile }) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  useEffect(() => {
    const historyQuery = query(collection(db, "tramites"), where("userId", "==", profile.uid));
    return onSnapshot(historyQuery, (snapshot) => {
      const today = new Date().toISOString().slice(0, 10);
      const next = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as HistoryItem).filter((item) => !item.createdAt || item.createdAt.startsWith(today));
      setItems(next);
    }, () => setItems([]));
  }, [profile.uid]);

  return <section className="mt-6 overflow-hidden rounded-2xl border border-[#dbe5ef] bg-white shadow-sm"><div className="flex flex-col gap-2 border-b border-[#e8eff5] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#147b94]">Actividad del día</p><h2 className="mt-1 text-lg font-semibold text-[#10233f]">Historial de trámites</h2></div><p className="text-xs text-slate-500">Solo visible para {profile.name}</p></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-[#f8fbfd] text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Referencia</th><th className="px-5 py-3 font-semibold">Fecha</th><th className="px-5 py-3 font-semibold">Estado</th></tr></thead><tbody className="divide-y divide-[#edf2f6]">{items.length === 0 ? <tr><td colSpan={3} className="px-5 py-8 text-center text-sm text-slate-500">No hay trámites procesados hoy.</td></tr> : items.map((item) => <tr key={item.id} className="hover:bg-[#fbfdfe]"><td className="px-5 py-4 font-medium text-[#10233f]">{item.reference || item.id}</td><td className="px-5 py-4 text-slate-600">{item.createdAt ? new Date(item.createdAt).toLocaleString("es-GT") : "—"}</td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClasses[item.status || "Pendiente"] || statusClasses.Pendiente}`}>{item.status || "Pendiente"}</span></td></tr>)}</tbody></table></div></section>;
}
