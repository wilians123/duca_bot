"use client";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../../firebase/client";
import type { UserProfile } from "@/types/auth";

type HistoryItem = {
  id: string;
  reference?: string;
  cliente?: string;
  ruta?: string;
  status?: "Pendiente" | "Completado" | "Error";
  createdAt?: string;
};

function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={17} height={17}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={17} height={17}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={17} height={17}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function WarnIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={17} height={17}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function UserHistoryPanel({ profile }: { profile: UserProfile }) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");

  useEffect(() => {
    const historyQuery = query(
      collection(db, "tramites"),
      where("userId", "==", profile.uid),
    );
    return onSnapshot(
      historyQuery,
      (snapshot) => {
        const next = snapshot.docs.map(
          (item) => ({ id: item.id, ...item.data() }) as HistoryItem,
        );
        setItems(next);
      },
      () => setItems([]),
    );
  }, [profile.uid]);

  const today = new Date().toISOString().slice(0, 10);
  const hoyCount = items.filter((item) => item.createdAt?.startsWith(today)).length;
  const completados = items.filter((item) => item.status === "Completado").length;
  const pendientes = items.filter((item) => item.status === "Pendiente").length;
  const errores = items.filter((item) => item.status === "Error").length;

  const statusBadge = (status?: string) => {
    if (status === "Completado")
      return (
        <span className="tag tag-ok">
          <span className="dot" /> Completado
        </span>
      );
    if (status === "Error")
      return (
        <span className="tag tag-bad">
          <span className="dot" /> Error
        </span>
      );
    return (
      <span className="tag tag-warn">
        <span className="dot" /> Pendiente
      </span>
    );
  };

  const filteredItems = items.filter((item) => {
    const text = (item.reference || item.id || "").toLowerCase();
    const matchesQuery = !searchQuery || text.includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "Todos" || (item.status || "Pendiente") === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const downloadCsv = () => {
    const rows = [
      ["Referencia", "Cliente", "Ruta", "Fecha", "Estado"],
      ...filteredItems.map((item) => [
        item.reference || item.id,
        item.cliente || "",
        item.ruta || "",
        item.createdAt ? new Date(item.createdAt).toLocaleString("es-GT") : "",
        item.status || "Pendiente",
      ]),
    ];
    const csv = rows
      .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "historial-tramites.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="view">
      <div className="page-head">
        <div>
          <h1>Historial de trámites</h1>
          <p>Todas las declaraciones que has procesado. Consulta sus archivos y el resultado del envío.</p>
        </div>
        <div className="head-actions">
          <button type="button" className="btn btn-ghost" onClick={downloadCsv}>
            Descargar
          </button>
        </div>
      </div>

      {/* 4 Métricas del historial */}
      <div className="metrics">
        <article className="metric">
          <div className="top">
            <span>Procesados hoy</span>
            <span className="ico" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
              <DocIcon />
            </span>
          </div>
          <strong>{hoyCount}</strong>
          <small>En la jornada actual</small>
        </article>

        <article className="metric">
          <div className="top">
            <span>Completados</span>
            <span className="ico" style={{ background: "var(--ok-soft)", color: "var(--ok)" }}>
              <CheckIcon />
            </span>
          </div>
          <strong>{completados}</strong>
          <small>Envíos exitosos</small>
        </article>

        <article className="metric">
          <div className="top">
            <span>Pendientes de envío</span>
            <span className="ico" style={{ background: "var(--warn-soft)", color: "var(--warn)" }}>
              <ClockIcon />
            </span>
          </div>
          <strong>{pendientes}</strong>
          <small>Esperan sesión SIECA</small>
        </article>

        <article className="metric">
          <div className="top">
            <span>Con error</span>
            <span className="ico" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
              <WarnIcon />
            </span>
          </div>
          <strong>{errores}</strong>
          <small>Requieren revisión</small>
        </article>
      </div>

      {/* Tabla de trámites */}
      <section className="card">
        <div className="card-head">
          <div>
            <h2>Trámites</h2>
            <p className="muted text-xs mt-0.5">Solo visible para {profile.name}</p>
          </div>
          <div className="filters" style={{ flex: "1 1 auto", justifyContent: "flex-end" }}>
            <label className="field" style={{ maxWidth: 220 }}>
              <span>Buscar</span>
              <input
                className="input"
                placeholder="Referencia o ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>
            <label className="field" style={{ maxWidth: 170 }}>
              <span>Estado</span>
              <select
                className="input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="Todos">Todos</option>
                <option value="Completado">Completado</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Error">Error</option>
              </select>
            </label>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Referencia</th>
                <th>Cliente</th>
                <th>Ruta</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 muted">
                    No hay trámites procesados con el filtro actual.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td className="mono font-semibold text-xs text-[var(--primary-ink)]">
                      {item.reference || item.id}
                    </td>
                    <td>{item.cliente || "—"}</td>
                    <td className="muted">{item.ruta || "—"}</td>
                    <td className="muted whitespace-nowrap text-xs">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString("es-GT")
                        : "—"}
                    </td>
                    <td>{statusBadge(item.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
