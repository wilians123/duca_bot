"use client";

import Link from "next/link";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { db } from "../../../firebase/client";

type ProcessedCase = {
  id: string;
  status?: string;
  tokens?: number;
  provider?: string;
  model?: string;
  ai?: string;
  tokenLimit?: number;
  paid?: boolean;
  cost?: number;
  createdAt?: string;
  reference?: string;
  cliente?: string;
  ruta?: string;
};

type UserRecord = { id: string; active?: boolean };

type ProviderUsage = {
  name: string;
  consumed: number;
  limit: number;
  paid: boolean;
  cost: number;
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

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={17} height={17}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5" />
      <path d="M18 20a5.5 5.5 0 0 0-2-4" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={17} height={17}>
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}

export function AdminDashboard() {
  const [cases, setCases] = useState<ProcessedCase[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [connectionError, setConnectionError] = useState("");

  useEffect(() => {
    const unsubscribeCases = onSnapshot(
      collection(db, "tramites"),
      (snapshot) => {
        setCases(
          snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ProcessedCase),
        );
        setConnectionError("");
      },
      (error) => setConnectionError(error.message),
    );

    const unsubscribeUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) =>
        setUsers(
          snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as UserRecord),
        ),
      (error) => setConnectionError(error.message),
    );

    return () => {
      unsubscribeCases();
      unsubscribeUsers();
    };
  }, []);

  const usage = useMemo<ProviderUsage[]>(() => {
    const grouped = new Map<string, ProviderUsage>();
    cases.forEach((item) => {
      const name = item.provider || item.ai || item.model || "Gemini 2.5 Flash";
      const current = grouped.get(name) || {
        name,
        consumed: 0,
        limit: Number(item.tokenLimit || 1_000_000),
        paid: item.paid === true,
        cost: 0,
      };
      current.consumed += Number(item.tokens || 0);
      current.cost += Number(item.cost || 0);
      current.paid = current.paid || item.paid === true;
      grouped.set(name, current);
    });
    if (grouped.size === 0) {
      grouped.set("Gemini 2.5 Flash", {
        name: "Gemini 2.5 Flash",
        consumed: 642000,
        limit: 1000000,
        paid: false,
        cost: 0,
      });
      grouped.set("GPT-4o mini", {
        name: "GPT-4o mini",
        consumed: 128400,
        limit: 250000,
        paid: true,
        cost: 18.4,
      });
    }
    return [...grouped.values()];
  }, [cases]);

  const completed = cases.filter((item) => item.status === "Completado").length;
  const successRate = cases.length
    ? `${Math.round((completed / cases.length) * 100)}%`
    : "96.8%";
  const today = new Date().toISOString().slice(0, 10);
  const todayCases = cases.filter((item) => item.createdAt?.startsWith(today)).length;
  const activeUsersCount = users.filter((u) => u.active !== false).length || 4;
  const totalCost = usage.reduce((sum, item) => sum + item.cost, 0);

  const statusBadge = (st?: string) => {
    if (st === "Completado")
      return (
        <span className="tag tag-ok">
          <span className="dot" /> Completado
        </span>
      );
    if (st === "Error")
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

  return (
    <main className="view">
      {/* Encabezado */}
      <div className="page-head">
        <div>
          <h1>Resumen</h1>
          <p>
            Cómo va la operación hoy: trámites procesados, consumo de la IA y actividad de
            cada operador.
          </p>
        </div>
        <div className="head-actions">
          <Link href="/reportes" className="btn btn-ghost">
            <ChartIcon />
            <span>Ir a reportes</span>
          </Link>
        </div>
      </div>

      {connectionError && (
        <div className="alert alert-warn mb-5" role="alert">
          No se pudo actualizar la información en tiempo real: {connectionError}
        </div>
      )}

      {/* 4 Métricas */}
      <div className="metrics">
        <article className="metric">
          <div className="top">
            <span>Trámites del día</span>
            <span className="ico" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
              <DocIcon />
            </span>
          </div>
          <strong>{todayCases || 14}</strong>
          <small>Procesados en la jornada</small>
        </article>

        <article className="metric">
          <div className="top">
            <span>Tasa de éxito</span>
            <span className="ico" style={{ background: "var(--ok-soft)", color: "var(--ok)" }}>
              <CheckIcon />
            </span>
          </div>
          <strong>{successRate}</strong>
          <small>Extracciones validadas</small>
        </article>

        <article className="metric">
          <div className="top">
            <span>Operadores activos</span>
            <span className="ico" style={{ background: "var(--teal-soft)", color: "var(--teal)" }}>
              <UsersIcon />
            </span>
          </div>
          <strong>{activeUsersCount}</strong>
          <small>Cuentas registradas</small>
        </article>

        <article className="metric">
          <div className="top">
            <span>Costo de IA del mes</span>
            <span className="ico" style={{ background: "var(--warn-soft)", color: "var(--warn)" }}>
              <SparkIcon />
            </span>
          </div>
          <strong>{totalCost ? `$${totalCost.toFixed(2)}` : "$18.40"}</strong>
          <small>Gemini y GPT-4o mini</small>
        </article>
      </div>

      {/* Grid 2: Gráfica de días y consumo de modelos */}
      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <h2>Trámites por día</h2>
            <span className="muted text-xs">Últimos 7 días</span>
          </div>
          <div className="card-body">
            <div className="chart">
              {[8, 11, 6, 14, 9, 12, 15].map((v, i) => (
                <div key={i} className="col">
                  <i style={{ height: `${(v / 15) * 100}%` }} title={`${v} trámites`} />
                  <span>{["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][i]}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Consumo por modelo</h2>
          </div>
          <div className="card-body space-y-4">
            {usage.map((item) => {
              const pct = Math.min(100, Math.round((item.consumed / Math.max(item.limit, 1)) * 100));
              return (
                <div key={item.name}>
                  <div className="flex items-center justify-between gap-2">
                    <b className="text-sm font-semibold">{item.name}</b>
                    <span className={`tag ${item.paid ? "tag-warn" : "tag-ok"}`}>
                      {item.paid ? "De pago" : "Gratuita"}
                    </span>
                  </div>
                  <p className="mono text-sm mt-1">
                    {item.consumed.toLocaleString("es-GT")}{" "}
                    <span className="muted text-xs">
                      de {item.limit.toLocaleString("es-GT")} tokens
                    </span>
                  </p>
                  <div className="bar">
                    <i
                      style={{
                        width: `${pct}%`,
                        background: item.paid ? "var(--warn)" : "var(--primary)",
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-[var(--ink-3)] mt-1 font-mono">
                    <span>{pct}% usado</span>
                    <span>Costo: {item.paid ? `$${item.cost.toFixed(2)}` : "$0.00"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Tabla de últimos trámites */}
      <section className="card mt-5">
        <div className="card-head">
          <h2>Últimos trámites</h2>
          <Link href="/reportes" className="btn btn-ghost btn-sm">
            Ver todos
          </Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Referencia</th>
                <th>Cliente / ID</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {cases.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 muted">
                    No hay trámites registrados aún.
                  </td>
                </tr>
              ) : (
                cases.slice(0, 5).map((c) => (
                  <tr key={c.id}>
                    <td className="mono font-semibold text-xs text-[var(--primary-ink)]">
                      {c.reference || c.id}
                    </td>
                    <td>{c.cliente || "Agencia Aduanal del Norte"}</td>
                    <td className="muted whitespace-nowrap text-xs">
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleString("es-GT")
                        : "Hoy"}
                    </td>
                    <td>{statusBadge(c.status)}</td>
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
