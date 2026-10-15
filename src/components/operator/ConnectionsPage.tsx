"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={20} height={20}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

export function ConnectionsPage() {
  const [gmailStatus, setGmailStatus] = useState<"loading" | "connected" | "disconnected" | "error">("loading");
  const [gmailEmail, setGmailEmail] = useState("");
  const { firebaseUser } = useAuth();

  const getToken = useCallback(() => firebaseUser?.getIdToken(), [firebaseUser]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const token = await getToken();
        const response = await fetch("/api/auth/gmail", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: "no-store",
        });
        const payload = await response.json() as { connected?: boolean; email?: string | null };
        if (!active) return;
        if (!response.ok) throw new Error("No se pudo consultar la conexión con Gmail.");
        setGmailStatus(payload.connected ? "connected" : "disconnected");
        setGmailEmail(payload.email || "");
      } catch {
        if (active) setGmailStatus("error");
      }
    })();
    return () => { active = false; };
  }, [getToken]);

  const connectGmail = async () => {
    try {
      const token = await getToken();
      const response = await fetch("/api/auth/gmail", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });
      const payload = await response.json() as { url?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error || "No se pudo iniciar la conexión con Gmail.");
      window.location.assign(payload.url);
    } catch {
      setGmailStatus("error");
    }
  };

  return (
    <main className="view">
      <div className="page-head">
        <div>
          <h1>Conexiones</h1>
          <p>Conexiones necesarias para recibir y procesar la documentación.</p>
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
                  <span className={`tag ${gmailStatus === "connected" ? "tag-ok" : "tag-neutral"}`}>
                    {gmailStatus === "loading" ? "Verificando..." : gmailStatus === "connected" ? "Conectado" : "Sin conectar"}
                  </span>
                </div>
                <p className="mono muted mt-1 text-xs">{gmailEmail || "Cuenta de operaciones"}</p>
                <p className="muted mt-2 text-sm">
                  Lectura de correos y descarga de adjuntos de los últimos 7 días.
                </p>
              </div>
            </div>
            {gmailStatus === "connected" ? (
              <button type="button" className="btn btn-ghost btn-block mt-4" disabled>
                Gmail vinculado a este usuario
              </button>
            ) : (
              <button type="button" className="btn btn-ghost btn-block mt-4" onClick={connectGmail} disabled={gmailStatus === "loading"}>
                Conectar Gmail
              </button>
            )}
            {gmailStatus === "error" && <p className="mt-2 text-sm text-[var(--danger)]" role="alert">No se pudo consultar Gmail. Recarga la página e inténtalo de nuevo.</p>}
          </div>
        </section>

      </div>
    </main>
  );
}
