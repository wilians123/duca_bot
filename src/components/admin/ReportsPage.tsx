"use client";

import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { db } from "../../../firebase/client";

type ProcessedCase = {
  id: string;
  userId?: string;
  reference?: string;
  numeroDuca?: string;
  cliente?: string;
  ruta?: string;
  status?: string;
  tokens?: number;
  createdAt?: string;
};

type ReportUser = { id: string; name?: string };

function ducaReference(item: ProcessedCase) {
  return item.status === "Completado"
    ? item.numeroDuca || "-"
    : "-";
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

export function ReportsPage() {
  const [cases, setCases] = useState<ProcessedCase[]>([]);
  const [users, setUsers] = useState<ReportUser[]>([]);
  const [reportDay, setReportDay] = useState(String(new Date().getDate()));
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const unsubscribeCases = onSnapshot(collection(db, "tramites"), (snapshot) => {
      const next = snapshot.docs.map(
        (item) => ({ id: item.id, ...item.data() }) as ProcessedCase,
      );
      next.sort(
        (a, b) =>
          (Date.parse(b.createdAt || "") || 0) -
          (Date.parse(a.createdAt || "") || 0),
      );
      setCases(next);
    });
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(
        snapshot.docs.map(
          (item) => ({ id: item.id, ...item.data() }) as ReportUser,
        ),
      );
    });
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
  const chartYear = new Date().getFullYear();
  const monthlyCompletions = useMemo(() => {
    const counts = Array.from({ length: 12 }, () => 0);
    cases.forEach((item) => {
      if (item.status !== "Completado" || !item.createdAt) return;
      const createdAt = new Date(item.createdAt);
      if (createdAt.getFullYear() === chartYear) {
        counts[createdAt.getMonth()] += 1;
      }
    });
    return counts;
  }, [cases, chartYear]);
  const highestMonthlyCount = Math.max(...monthlyCompletions, 1);

  const periodRows = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const end = new Date(
      now.getFullYear(),
      now.getMonth(),
      Number(reportDay),
      23,
      59,
      59,
    ).getTime();
    return cases.filter((item) => {
      const created = item.createdAt ? new Date(item.createdAt).getTime() : 0;
      return created >= start && created <= end;
    });
  }, [cases, reportDay]);

  const generateReport = () => {
    const headers = ["Referencia", "Usuario", "Estado", "Tokens", "Fecha"];
    const csv = [
      headers,
      ...periodRows.map((item) => [
        ducaReference(item),
        usersById.get(item.userId || "") || "Usuario",
        item.status || "Pendiente",
        String(item.tokens || 0),
        item.createdAt || "",
      ]),
    ]
      .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte-ducas-${new Date().toISOString().slice(0, 7)}-${reportDay}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice(
      `Reporte generado: ${periodRows.length} registros del 01 al ${reportDay} de este mes.`,
    );
  };

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
      <div className="page-head">
        <div>
          <h1>Reportes</h1>
          <p>
            Arma un archivo con los trámites del mes, desde el día 01 hasta el corte que
            elijas.
          </p>
        </div>
      </div>

      {notice && (
        <div className="alert alert-info mb-4">
          <InfoIcon />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid-2">
        {/* Construir reporte */}
        <section className="card">
          <div className="card-head">
            <h2>Construir reporte</h2>
          </div>
          <div className="card-body">
            <div className="filters">
              <label className="field">
                <span>Día de corte</span>
                <input
                  type="number"
                  min={1}
                  max={31}
                  className="input"
                  value={reportDay}
                  onChange={(e) => setReportDay(e.target.value)}
                />
              </label>
              <button
                type="button"
                onClick={generateReport}
                className="btn btn-primary"
                style={{ alignSelf: "flex-end" }}
              >
                <DownloadIcon />
                <span>Generar reporte</span>
              </button>
            </div>

            <div className="alert alert-info mt-4">
              <InfoIcon />
              <span>
                El archivo sale en CSV con referencia, operador, estado, tokens consumidos
                y fecha de cada trámite.
              </span>
            </div>

            <div className="chart mt-5">
              {monthlyCompletions.map((count, month) => (
                <div key={month} className="col">
                  <i
                    style={{
                      height: count
                        ? `${Math.max(4, (count / highestMonthlyCount) * 100)}%`
                        : "0%",
                    }}
                    title={`${count} trámites completados`}
                    aria-label={`${count} trámites completados`}
                  />
                  <span>
                    {new Intl.DateTimeFormat("es-GT", { month: "short" })
                      .format(new Date(chartYear, month, 1))
                      .replace(".", "")}
                  </span>
                </div>
              ))}
            </div>
            <p className="muted text-xs text-center mt-2">
              Trámites completados por mes · {chartYear}
            </p>
          </div>
        </section>

        {/* Reportes recientes */}
        <section className="card" style={{ alignSelf: "start" }}>
          <div className="card-head">
            <h2>Reportes recientes</h2>
          </div>
          <div className="card-body space-y-2.5">
            {[
              ["reporte-ducas-2026-08.csv", "54 registros", "01 sep 2026"],
              ["reporte-ducas-2026-07.csv", "47 registros", "01 ago 2026"],
              ["reporte-ducas-2026-06.csv", "38 registros", "01 jul 2026"],
            ].map(([n, r, f]) => (
              <div
                key={n}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".7rem",
                  padding: ".65rem .75rem",
                  border: "1px solid var(--line-soft)",
                  borderRadius: "var(--r-md)",
                }}
              >
                <span className="ftype ft-xls">CSV</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <b
                    className="mono block text-xs"
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {n}
                  </b>
                  <small className="muted text-xs">
                    {r} · {f}
                  </small>
                </div>
                <button
                  type="button"
                  onClick={generateReport}
                  className="btn btn-quiet btn-sm"
                  title={`Descargar ${n}`}
                >
                  <DownloadIcon />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Detalle del periodo */}
      <section className="card mt-5">
        <div className="card-head">
          <h2>Detalle del periodo</h2>
          <span className="muted text-xs">01 al {reportDay} de este mes</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Referencia</th>
                <th>Usuario</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {periodRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 muted">
                    No hay trámites en el periodo seleccionado.
                  </td>
                </tr>
              ) : (
                periodRows.map((item) => (
                  <tr key={item.id}>
                    <td className="mono font-semibold text-xs text-[var(--primary-ink)]">
                      {ducaReference(item)}
                    </td>
                    <td>{usersById.get(item.userId || "") || "Usuario"}</td>
                    <td>{statusBadge(item.status)}</td>
                    <td className="muted whitespace-nowrap text-xs">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString("es-GT")
                        : "—"}
                    </td>
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
