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
  numeroDuca?: string;
  userId?: string;
  cliente?: string;
  ruta?: string;
};

type UserRecord = { id: string; name?: string; role?: string; active?: boolean };

function ducaReference(item: ProcessedCase) {
  return item.status === "Completado" ? item.numeroDuca || "-" : "-";
}

type ProviderUsage = {
  name: string;
  consumed: number;
  limit?: number;
  paid?: boolean;
  cost: number;
  tokenRecords: number;
  costRecords: number;
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
        const next = snapshot.docs.map(
          (item) => ({ id: item.id, ...item.data() }) as ProcessedCase,
        );
        next.sort(
          (a, b) =>
            (Date.parse(b.createdAt || "") || 0) -
            (Date.parse(a.createdAt || "") || 0),
        );
        setCases(next);
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

  const usersById = useMemo(
    () => users.reduce(
      (result, user) => result.set(user.id, user.name || "Usuario"),
      new Map<string, string>(),
    ),
    [users],
  );

  const usage = useMemo<ProviderUsage[]>(() => {
    const grouped = new Map<string, ProviderUsage>();
    cases.forEach((item) => {
      const name = item.provider || item.ai || item.model;
      if (!name) return;
      const current = grouped.get(name) || {
        name,
        consumed: 0,
        limit: undefined,
        paid: undefined,
        cost: 0,
        tokenRecords: 0,
        costRecords: 0,
      };
      if (typeof item.tokens === "number" && Number.isFinite(item.tokens)) {
        current.consumed += item.tokens;
        current.tokenRecords += 1;
      }
      if (typeof item.tokenLimit === "number" && Number.isFinite(item.tokenLimit)) {
        current.limit = item.tokenLimit;
      }
      if (typeof item.cost === "number" && Number.isFinite(item.cost)) {
        current.cost += item.cost;
        current.costRecords += 1;
      }
      if (typeof item.paid === "boolean") current.paid = item.paid;
      grouped.set(name, current);
    });
    return [...grouped.values()];
  }, [cases]);

  const completed = cases.filter((item) => item.status === "Completado").length;
  const successRate = cases.length
    ? `${Math.round((completed / cases.length) * 100)}%`
    : "—";
  const dailyActivity = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const count = cases.filter((item) => {
        if (!item.createdAt) return false;
        const createdAt = new Date(item.createdAt);
        return (
          createdAt.getFullYear() === date.getFullYear() &&
          createdAt.getMonth() === date.getMonth() &&
          createdAt.getDate() === date.getDate()
        );
      }).length;
      return {
        count,
        label: new Intl.DateTimeFormat("es-GT", { weekday: "short" })
          .format(date)
          .replace(".", ""),
      };
    });
  }, [cases]);
  const todayCases = dailyActivity[dailyActivity.length - 1]?.count || 0;
  const activeUsersCount = users.filter((u) => u.role === "user" && u.active !== false).length;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthlyCostRecords = cases.filter((item) => {
    if (typeof item.cost !== "number" || !Number.isFinite(item.cost) || !item.createdAt) return false;
    const createdAt = new Date(item.createdAt);
    return createdAt >= monthStart && createdAt < nextMonthStart;
  });
  const totalCost = monthlyCostRecords.reduce((sum, item) => sum + (item.cost || 0), 0);
  const maxDailyCount = Math.max(...dailyActivity.map((item) => item.count), 1);

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
    if (st === "Cancelado")
      return (
        <span className="tag tag-warn">
          <span className="dot" /> Cancelado
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
          <strong>{todayCases}</strong>
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
          <small>Completados del total registrado</small>
        </article>

        <article className="metric">
          <div className="top">
            <span>Operadores activos</span>
            <span className="ico" style={{ background: "var(--teal-soft)", color: "var(--teal)" }}>
              <UsersIcon />
            </span>
          </div>
          <strong>{activeUsersCount}</strong>
          <small>Operadores habilitados</small>
        </article>

        <article className="metric">
          <div className="top">
            <span>Costo de IA del mes</span>
            <span className="ico" style={{ background: "var(--warn-soft)", color: "var(--warn)" }}>
              <SparkIcon />
            </span>
          </div>
          <strong>{monthlyCostRecords.length ? `$${totalCost.toFixed(2)}` : "—"}</strong>
          <small>{monthlyCostRecords.length ? "Costos registrados este mes" : "Sin costos registrados este mes"}</small>
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
              {dailyActivity.map((item, index) => (
                <div key={index} className="col">
                  <i
                    style={{
                      height: item.count
                        ? `${Math.max(4, (item.count / maxDailyCount) * 100)}%`
                        : "0%",
                    }}
                    title={`${item.count} trámites`}
                    aria-label={`${item.count} trámites`}
                  />
                  <span>{item.label}</span>
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
            {usage.length === 0 ? (
              <p className="muted text-sm">No hay datos de consumo por modelo registrados.</p>
            ) : usage.map((item) => {
              const pct = item.tokenRecords > 0 && item.limit && item.limit > 0
                ? Math.min(100, Math.round((item.consumed / item.limit) * 100))
                : null;
              return (
                <div key={item.name}>
                  <div className="flex items-center justify-between gap-2">
                    <b className="text-sm font-semibold">{item.name}</b>
                    {typeof item.paid === "boolean" && (
                      <span className={`tag ${item.paid ? "tag-warn" : "tag-ok"}`}>
                        {item.paid ? "De pago" : "Gratuita"}
                      </span>
                    )}
                  </div>
                  <p className="mono text-sm mt-1">
                    {item.tokenRecords
                      ? `${item.consumed.toLocaleString("es-GT")} tokens consumidos`
                      : "Sin consumo de tokens registrado"}
                    {item.limit !== undefined && (
                      <span className="muted text-xs"> · límite {item.limit.toLocaleString("es-GT")}</span>
                    )}
                  </p>
                  {pct !== null && (
                    <>
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
                      </div>
                    </>
                  )}
                  <p className="muted text-xs mt-1">
                    {item.costRecords ? `Costo registrado: $${item.cost.toFixed(2)}` : "Costo no registrado"}
                  </p>
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
                <th>Número DUCA</th>
                <th>Usuario</th>
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
                      {ducaReference(c)}
                    </td>
                    <td>{usersById.get(c.userId || "") || "Usuario"}</td>
                    <td className="muted whitespace-nowrap text-xs">
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleString("es-GT")
                        : "—"}
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
