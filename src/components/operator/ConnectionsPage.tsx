"use client";

import { useState } from "react";

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={20} height={20}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={20} height={20}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export function ConnectionsPage() {
  const [siecaStatus, setSiecaStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const testSiecaConnection = async () => {
    setSiecaStatus("loading");
    try {
      const response = await fetch("/api/auth", { method: "POST" });
      setSiecaStatus(response.ok ? "success" : "error");
    } catch {
      setSiecaStatus("error");
    }
  };

  return (
    <main className="view">
      <div className="page-head">
        <div>
          <h1>Conexiones</h1>
          <p>Las dos cuentas que el sistema necesita para trabajar por ti.</p>
        </div>
      </div>

      <div className="grid-auto">
        <section className="card">
          <div className="card-body">
            <div className="flex items-start gap-3">
              <span className="grid h-[42px] w-[42px] flex-none place-items-center rounded-xl bg-[var(--danger-soft)] text-[var(--danger)]">
                <MailIcon />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base">Gmail</h2>
                  <span className="tag tag-neutral">Sin conectar</span>
                </div>
                <p className="mono muted mt-1 text-xs">Cuenta de operaciones</p>
                <p className="muted mt-2 text-sm">
                  Lectura de correos y descarga de adjuntos de los últimos 7 días.
                </p>
              </div>
            </div>
            <a href="/api/auth/gmail" className="btn btn-ghost btn-block mt-4">
              Conectar Gmail
            </a>
          </div>
        </section>

        <section className="card">
          <div className="card-body">
            <div className="flex items-start gap-3">
              <span className="grid h-[42px] w-[42px] flex-none place-items-center rounded-xl bg-[var(--teal-soft)] text-[var(--teal)]">
                <ShieldIcon />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base">SIECA</h2>
                  <span className={`tag ${siecaStatus === "success" ? "tag-ok" : "tag-neutral"}`}>
                    <span className="dot" />
                    {siecaStatus === "success" ? "Conectado" : "Sin conectar"}
                  </span>
                </div>
                <p className="mono muted mt-1 text-xs">Sesión del portal DUCA-T</p>
                <p className="muted mt-2 text-sm">
                  Se abre al final del trámite para firmar y enviar la declaración. La sesión dura 30 minutos.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-block mt-4"
              onClick={testSiecaConnection}
              disabled={siecaStatus === "loading"}
            >
              {siecaStatus === "loading" ? "Abriendo sesión..." : "Probar sesión"}
            </button>
            {siecaStatus === "error" && (
              <p className="mt-2 text-sm text-[var(--danger)]" role="alert">
                No se pudo completar la conexión con SIECA.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
