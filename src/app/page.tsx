"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { AuditEntry, createAuditEntry, initialAuditEntry } from "@/lib/audit";
import { DucaPreviewForm, DucaDataState } from "@/components/operator/DucaPreviewForm";
import { ActivityConsole } from "@/components/operator/ActivityConsole";

type ApiResponse = {
  ok: boolean;
  message: string;
  data?: unknown;
  hasDiscrepancies?: boolean;
  discrepancyDetails?: string | null;
  error?:
    | string
    | { codigo?: string; mensaje?: string; detalle?: string | null };
  codigoError?: string;
  archivosJson?: { nombreArchivo: string; datos: unknown }[];
};

type GmailMessage = {
  id: string;
  subject: string;
  from: string;
  date: string;
  cuerpo: string;
  archivosAdjuntos: string[];
};

function separarCsv(linea: string): string[] {
  const celdas: string[] = [];
  let actual = "";
  let entreComillas = false;
  for (let indice = 0; indice < linea.length; indice += 1) {
    const caracter = linea[indice];
    if (caracter === '"' && linea[indice + 1] === '"') {
      actual += '"';
      indice += 1;
    } else if (caracter === '"') {
      entreComillas = !entreComillas;
    } else if (caracter === "," && !entreComillas) {
      celdas.push(actual.trim());
      actual = "";
    } else {
      actual += caracter;
    }
  }
  celdas.push(actual.trim());
  return celdas;
}

function ArchivoTexto({ nombreArchivo, datos }: { nombreArchivo: string; datos: unknown }) {
  const texto = typeof datos === "string" ? datos : String(datos ?? "");
  const esTabla = /\.(xls|xlsx)$/i.test(nombreArchivo) && texto.includes("\n");
  const filas = esTabla ? texto.split(/\r?\n/).filter(Boolean).map(separarCsv) : [];

  if (esTabla && filas.length > 0) {
    return (
      <div className="table-wrap max-h-96 overflow-auto">
        <table>
          <tbody>
            {filas.map((fila, filaIndice) => (
              <tr key={filaIndice} className={filaIndice === 0 ? "font-semibold bg-[var(--surface-2)]" : ""}>
                {fila.map((celda, celdaIndice) => (
                  <td key={celdaIndice} className="text-xs">
                    {celda}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <pre className="mono max-h-96 overflow-auto p-4 text-xs leading-6" style={{ background: "#0F1C33", color: "#9FE8C8" }}>
      {texto}
    </pre>
  );
}

class ApiRequestError extends Error {
  constructor(
    public codigo: string,
    message: string,
    public detalle?: string | null,
  ) {
    super(message);
  }
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 flex-none">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 flex-none">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 flex-none">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function WarnIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 flex-none text-[var(--warn)]">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 flex-none">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
function ClipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 flex-none">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 flex-none">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 flex-none">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export default function Home() {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([initialAuditEntry]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<DucaDataState | null>(null);
  const [hasDiscrepancies, setHasDiscrepancies] = useState(false);
  const [discrepancyDetails, setDiscrepancyDetails] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showArchivosJson, setShowArchivosJson] = useState(false);

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [archivosJson, setArchivosJson] = useState<
    { nombreArchivo: string; datos: unknown }[]
  >([]);

  // Estados para Gmail
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);
  const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>([]);
  const [selectedMailId, setSelectedMailId] = useState("");
  const [selectedAttachmentIndexes, setSelectedAttachmentIndexes] = useState<
    Record<string, number[]>
  >({});
  const [isLoadingMails, setIsLoadingMails] = useState(false);
  const [mailFilterQuery, setMailFilterQuery] = useState("");

  const canExtract = useMemo(
    () =>
      Boolean(
        (pdfFile || selectedMailId) &&
          (!selectedMailId || selectedAttachmentIndexes[selectedMailId]?.length),
      ) && !isExtracting,
    [pdfFile, selectedMailId, selectedAttachmentIndexes, isExtracting],
  );

  const pushLog = (message: string, level: AuditEntry["level"] = "info") => {
    setAuditLog((entries) => [createAuditEntry(message, level), ...entries]);
  };

  const handleApiResponse = async (response: Response) => {
    const payload = (await response.json()) as ApiResponse;

    if (!response.ok || !payload.ok) {
      const error =
        typeof payload.error === "string"
          ? { mensaje: payload.error }
          : payload.error;
      throw new ApiRequestError(
        error?.codigo || payload.codigoError || "API_UNKNOWN_ERR",
        error?.mensaje || payload.message || "Operación fallida.",
        error?.detalle,
      );
    }

    return payload;
  };

  const connectGmail = () => {
    setIsConnectingGmail(true);
    pushLog("Redirigiendo a Google para autorizar acceso a Gmail...");
    window.location.href = "/api/auth/gmail";
  };

  const fetchGmailMessages = async () => {
    setIsLoadingMails(true);
    pushLog("Consultando bandeja de entrada de Gmail...");

    try {
      const response = await fetch("/api/gmail/list");
      const payload = await handleApiResponse(response);
      const messages = (payload.data as GmailMessage[]) || [];
      setGmailMessages(messages);
      if (messages.length > 0 && !selectedMailId) {
        setSelectedMailId(messages[0].id);
      }
      setSelectedAttachmentIndexes(
        Object.fromEntries(
          messages.map((message) => [
            message.id,
            message.archivosAdjuntos.map((_, index) => index),
          ]),
        ),
      );
      pushLog("Correos recientes cargados exitosamente.", "success");
    } catch (error) {
      const mensaje =
        error instanceof ApiRequestError
          ? `[${error.codigo}] ${error.message}${error.detalle ? ` Detalle: ${error.detalle}` : ""}`
          : error instanceof Error
            ? error.message
            : "Error al obtener correos de Gmail.";
      pushLog(mensaje, "error");
    } finally {
      setIsLoadingMails(false);
    }
  };

  const authenticate = async () => {
    setIsAuthenticating(true);
    pushLog("Abriendo navegador visible para login SIECA...");

    try {
      const response = await fetch("/api/auth", { method: "POST" });
      const payload = await handleApiResponse(response);
      pushLog(payload.message, "success");
    } catch (error) {
      pushLog(
        error instanceof ApiRequestError
          ? `[${error.codigo}] ${error.message}`
          : error instanceof Error
            ? error.message
            : "Error durante autenticacion.",
        "error",
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  const extractData = async () => {
    if (!pdfFile && !selectedMailId) {
      pushLog(
        "Seleccione un PDF local o un correo de Gmail antes de extraer datos.",
        "error",
      );
      return;
    }
    if (
      selectedMailId &&
      !selectedAttachmentIndexes[selectedMailId]?.length
    ) {
      pushLog("Seleccione al menos un archivo adjunto para extraer datos.", "error");
      return;
    }

    setIsExtracting(true);
    setParsedData(null);
    setShowPreview(false);
    setShowArchivosJson(false);
    pushLog(
      selectedMailId
        ? `Procesando correo de Gmail ID: ${selectedMailId}`
        : `Procesando manifiesto local: ${pdfFile?.name}`,
    );

    try {
      const formData = new FormData();
      if (pdfFile) formData.append("file", pdfFile);
      if (selectedMailId) {
        formData.append("mailId", selectedMailId);
        formData.append(
          "selectedAttachmentIndexes",
          JSON.stringify(selectedAttachmentIndexes[selectedMailId] || []),
        );
      }

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 270_000);
      let response: Response;
      try {
        response = await fetch("/api/extract", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
      } finally {
        window.clearTimeout(timeout);
      }
      const payload = await handleApiResponse(response);

      const extractedData = payload.data as DucaDataState;
      setParsedData(extractedData);
      setHasDiscrepancies(payload.hasDiscrepancies || false);
      setDiscrepancyDetails(payload.discrepancyDetails || null);
      setArchivosJson(payload.archivosJson || []);

      pushLog(payload.message, "success");
      if (payload.hasDiscrepancies) {
        pushLog("La extraccion termino pero hay discrepancias detectadas.", "error");
      }
    } catch (error) {
      const mensaje =
        error instanceof ApiRequestError
          ? `[${error.codigo}] ${error.message}${error.detalle ? ` Detalle: ${error.detalle}` : ""}`
          : error instanceof Error
            ? error.message
            : "Error al extraer datos.";
      pushLog(mensaje, "error");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (file && file.type !== "application/pdf") {
      setPdfFile(null);
      pushLog("El archivo seleccionado no es PDF.", "error");
      return;
    }

    setPdfFile(file);
    if (file) {
      setSelectedMailId("");
      pushLog(`PDF cargado en interfaz: ${file.name}`);
    }
  };

  const handleDataChange = (newData: DucaDataState) => {
    setParsedData(newData);
  };

  const step1Done = gmailMessages.length > 0;
  const step2Done = Boolean(selectedMailId || pdfFile);
  const step3Done = Boolean(parsedData);
  const step4Done = Boolean(parsedData && !hasDiscrepancies);
  const step5Done = isAuthenticating;

  const currentStep = !step1Done ? 1 : !step2Done ? 2 : !step3Done ? 3 : !step4Done ? 4 : 5;
  const progressPercent = ((currentStep - 1) / 4) * 100;

  const selectedMail = gmailMessages.find((m) => m.id === selectedMailId);
  const selectedCount = selectedMailId
    ? (selectedAttachmentIndexes[selectedMailId] || []).length
    : 0;

  const filteredMessages = gmailMessages.filter((msg) => {
    if (!mailFilterQuery) return true;
    const q = mailFilterQuery.toLowerCase();
    return (
      msg.subject.toLowerCase().includes(q) ||
      msg.from.toLowerCase().includes(q) ||
      msg.cuerpo.toLowerCase().includes(q)
    );
  });

  return (
    <main className="view">
      {/* Encabezado */}
      <div className="page-head">
        <div>
          <h1>Trámite nuevo</h1>
          <p>
            Conecta Gmail, elige el correo con los documentos del embarque y extrae los
            datos para armar la DUCA-T con IA.
          </p>
        </div>
        <div className="head-actions">
          <button
            type="button"
            onClick={fetchGmailMessages}
            disabled={isLoadingMails}
            className="btn btn-ghost"
          >
            {isLoadingMails ? "Cargando..." : "Actualizar bandeja"}
          </button>
          <button
            type="button"
            onClick={connectGmail}
            disabled={isConnectingGmail}
            className="btn btn-primary"
          >
            <MailIcon />
            <span>{isConnectingGmail ? "Conectando..." : "Conectar Gmail"}</span>
          </button>
        </div>
      </div>

      {/* FLOWBAR */}
      <div className="flowbar" aria-label="Progreso del trámite">
        <div className="flow-track">
          <div className={`flow-step ${step1Done ? "is-done" : currentStep === 1 ? "is-current" : ""}`}>
            <span className="flow-num">{step1Done ? "✓" : "1"}</span>
            <div>
              <b>1. Conectar Gmail</b>
              <small>{step1Done ? "Bandeja activa" : "Conecta tu cuenta"}</small>
            </div>
          </div>
          <div className={`flow-step ${step2Done ? "is-done" : currentStep === 2 ? "is-current" : !step1Done ? "is-locked" : ""}`}>
            <span className="flow-num">{step2Done ? "✓" : "2"}</span>
            <div>
              <b>2. Elegir correo</b>
              <small>{selectedMail ? "1 conversación" : "Marca los adjuntos"}</small>
            </div>
          </div>
          <div className={`flow-step ${step3Done ? "is-done" : currentStep === 3 ? "is-current" : !step2Done ? "is-locked" : ""}`}>
            <span className="flow-num">{step3Done ? "✓" : "3"}</span>
            <div>
              <b>3. Extraer datos</b>
              <small>{parsedData ? "Datos listos" : "Lectura con IA"}</small>
            </div>
          </div>
          <div className={`flow-step ${step4Done ? "is-done" : currentStep === 4 ? "is-current" : !step3Done ? "is-locked" : ""}`}>
            <span className="flow-num">{step4Done ? "✓" : "4"}</span>
            <div>
              <b>4. Revisar DUCA T</b>
              <small>{hasDiscrepancies ? "Revisar datos" : "9 pasos completos"}</small>
            </div>
          </div>
          <div className={`flow-step ${step5Done ? "is-done" : currentStep === 5 ? "is-current" : !step3Done ? "is-locked" : ""}`}>
            <span className="flow-num">{step5Done ? "✓" : "5"}</span>
            <div>
              <b>5. Enviar a SIECA</b>
              <small>Firma y radicación</small>
            </div>
          </div>
        </div>
        <div className="flow-progress">
          <i style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* BANDEJA TIPO GMAIL */}
      {gmailMessages.length === 0 ? (
        <section className="card p-8 text-center" style={{ minHeight: 280, display: "grid", placeContent: "center", gap: "1rem" }}>
          <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
            <MailIcon />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Conecta tu bandeja de entrada</h2>
            <p className="muted mt-1 max-w-md mx-auto text-sm">
              Conecta tu correo institucional de Gmail para recibir y procesar automáticamente los
              documentos de embarque de los clientes.
            </p>
          </div>
          <div className="flex gap-3 justify-center mt-2">
            <button type="button" onClick={connectGmail} className="btn btn-primary">
              <MailIcon />
              <span>Conectar cuenta de Gmail</span>
            </button>
            <button type="button" onClick={fetchGmailMessages} disabled={isLoadingMails} className="btn btn-ghost">
              {isLoadingMails ? "Cargando..." : "Cargar correos"}
            </button>
          </div>
        </section>
      ) : (
        <section className="mailbox">
          <div className="mail-toolbar">
            <div className="search">
              <SearchIcon />
              <input
                className="input"
                placeholder="Buscar por cliente, asunto o contenedor..."
                value={mailFilterQuery}
                onChange={(e) => setMailFilterQuery(e.target.value)}
              />
            </div>
            <div className="seg">
              <button type="button" aria-pressed="true">Todos</button>
              <button type="button" aria-pressed="false">Con adjuntos</button>
            </div>
            <span className="muted text-xs ml-auto">
              {filteredMessages.length} conversación{filteredMessages.length !== 1 ? "es" : ""}
            </span>
          </div>

          <div className="mail-panes">
            <div className="mail-list">
              {filteredMessages.length === 0 ? (
                <div className="empty">
                  <b>Sin resultados</b>
                  <p>Prueba con otro término de búsqueda.</p>
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  const isSelected = selectedMailId === msg.id;
                  const count = msg.archivosAdjuntos.length;
                  return (
                    <article
                      key={msg.id}
                      className={`thread ${isSelected ? "is-open" : ""}`}
                      onClick={() => {
                        setSelectedMailId(msg.id);
                        setPdfFile(null);
                        setSelectedAttachmentIndexes((prev) =>
                          prev[msg.id]
                            ? prev
                            : {
                                ...prev,
                                [msg.id]: msg.archivosAdjuntos.map((_, i) => i),
                              },
                        );
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <span
                        className="thread-av"
                        style={{
                          background: isSelected ? "var(--primary)" : "var(--ink-2)",
                        }}
                      >
                        {msg.from.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="thread-main">
                        <div className="thread-top">
                          <b>{msg.from.split("<")[0].trim() || msg.from}</b>
                          {count > 0 && <span className="thread-count">[{count}]</span>}
                          <span className="thread-time">
                            {new Date(msg.date).toLocaleDateString("es-GT", {
                              month: "numeric",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <span className="thread-subject">{msg.subject}</span>
                        <span className="thread-snippet">
                          {msg.cuerpo ? msg.cuerpo.slice(0, 80) + "…" : "Sin contenido de texto"}
                        </span>
                        {count > 0 && (
                          <div className="thread-meta">
                            <span className="clip">
                              <ClipIcon />
                              <span>{count} archivo{count !== 1 ? "s" : ""}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            <div className="mail-reader">
              {selectedMail ? (
                <>
                  <header className="reader-head">
                    <h2>{selectedMail.subject}</h2>
                    <div className="reader-sub">
                      <span className="tag tag-neutral">De: {selectedMail.from}</span>
                      <span className="tag tag-neutral">
                        Fecha: {new Date(selectedMail.date).toLocaleString("es-GT")}
                      </span>
                      {selectedMail.archivosAdjuntos.length > 0 && (
                        <span className="tag tag-info">
                          {selectedCount} de {selectedMail.archivosAdjuntos.length} adjuntos elegidos
                        </span>
                      )}
                    </div>
                  </header>

                  <div className="msg-list">
                    <article className="msg">
                      <header className="msg-head">
                        <span className="msg-av" style={{ background: "var(--primary)" }}>
                          {selectedMail.from.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="msg-who">
                          <b>{selectedMail.from}</b>
                          <small>{selectedMail.subject}</small>
                        </span>
                        <span className="msg-when">
                          {new Date(selectedMail.date).toLocaleDateString()}
                        </span>
                      </header>

                      <div className="msg-body">
                        {selectedMail.cuerpo || "Este correo no contiene texto plano."}
                      </div>

                      {selectedMail.archivosAdjuntos.length > 0 && (
                        <div className="msg-files">
                          {selectedMail.archivosAdjuntos.map((nombre, index) => {
                            const isChecked =
                              selectedAttachmentIndexes[selectedMail.id]?.includes(index) ?? false;
                            const ext = nombre.split(".").pop()?.toLowerCase() || "";
                            const isPdf = ext === "pdf";
                            const isXls = ext === "xls" || ext === "xlsx";
                            return (
                              <label key={`${nombre}-${index}`} className="filechip">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setSelectedAttachmentIndexes((prev) => {
                                      const current = prev[selectedMail.id] || [];
                                      return {
                                        ...prev,
                                        [selectedMail.id]: checked
                                          ? [...current, index]
                                          : current.filter((i) => i !== index),
                                      };
                                    });
                                  }}
                                  style={{ accentColor: "var(--primary)", width: 16, height: 16 }}
                                />
                                <span className={`ftype ${isPdf ? "ft-pdf" : isXls ? "ft-xls" : "ft-doc"}`}>
                                  {ext.slice(0, 3).toUpperCase()}
                                </span>
                                <span style={{ minWidth: 0 }}>
                                  <span className="fname" style={{ display: "block" }}>
                                    {nombre}
                                  </span>
                                  <span className="fsize">Adjunto de embarque</span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </article>
                  </div>
                </>
              ) : (
                <div className="empty">
                  <MailIcon />
                  <b>Ningún correo seleccionado</b>
                  <p>Selecciona un correo de la lista izquierda para revisar sus adjuntos.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* TARJETA EXTRAER DATOS */}
      <section className="card mt-5">
        <div className="card-head">
          <div>
            <h2>Extraer los datos</h2>
            <p className="muted text-sm mt-0.5">
              La IA lee los archivos marcados y arma la DUCA-T. También puedes subir un archivo desde tu
              computadora.
            </p>
          </div>
          {parsedData && (
            <span className="tag tag-ok">
              <span className="dot" /> Datos listos
            </span>
          )}
        </div>

        <div className="card-body">
          <div className="grid-auto items-end">
            <label className="field">
              <span>Archivos elegidos del correo</span>
              <input
                className="input"
                readOnly
                value={
                  selectedCount > 0
                    ? `${selectedCount} archivo${selectedCount !== 1 ? "s" : ""} de «${selectedMail?.subject?.slice(0, 32) || ""}…»`
                    : "Todavía no has marcado archivos"
                }
              />
            </label>

            <label className="field">
              <span>O sube un archivo (PDF, XLS o XLSX)</span>
              <input
                className="input"
                type="file"
                accept="application/pdf,.pdf,.xls,.xlsx"
                onChange={handleFileChange}
                style={{ padding: ".35rem" }}
              />
            </label>

            <button
              type="button"
              onClick={extractData}
              disabled={!canExtract || isExtracting}
              className="btn btn-primary"
            >
              <SparkIcon />
              <span>
                {isExtracting
                  ? "Extrayendo..."
                  : parsedData
                    ? "Volver a extraer"
                    : "Extraer datos"}
              </span>
            </button>
          </div>

          {parsedData && (
            <div className="mt-5 space-y-4">
              {hasDiscrepancies && (
                <div className="alert alert-warn">
                  <WarnIcon />
                  <div className="flex-1">
                    <b>Discrepancia detectada entre correo y adjuntos.</b>
                    <p className="text-xs sm:text-sm mt-0.5">{discrepancyDetails}</p>
                    <button
                      type="button"
                      onClick={() => setHasDiscrepancies(false)}
                      className="btn btn-sm btn-ghost mt-2"
                    >
                      Aprobar y resolver discrepancias
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPreview((prev) => !prev)}
                  className="btn btn-primary"
                >
                  <DocIcon />
                  <span>{showPreview ? "Ocultar DUCA T" : "Revisar DUCA T"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowArchivosJson(true)}
                  className="btn btn-ghost"
                >
                  Ver archivos leídos ({archivosJson.length})
                </button>

                <button
                  type="button"
                  onClick={authenticate}
                  disabled={isAuthenticating}
                  className="btn btn-go ml-auto"
                >
                  <ShieldIcon />
                  <span>
                    {isAuthenticating ? "Autenticando..." : "Autenticar en SIECA y enviar"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* MODAL ARCHIVOS LEÍDOS */}
      {showArchivosJson && (
        <div className="modal" onClick={() => setShowArchivosJson(false)}>
          <div
            className="modal-box lg"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <header className="modal-head">
              <div className="flex-1">
                <h2>Archivos leídos por el extractor</h2>
                <p>Datos individuales procesados por la IA para este embarque.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowArchivosJson(false)}
                className="btn btn-quiet btn-sm"
              >
                <CloseIcon />
              </button>
            </header>

            <div className="modal-body space-y-4">
              {archivosJson.length > 0 ? (
                archivosJson.map((archivo, indice) => (
                  <article
                    key={`${archivo.nombreArchivo}-${indice}`}
                    className="border border-[var(--line)] rounded-[var(--r-md)] overflow-hidden"
                  >
                    <header className="px-4 py-2.5 bg-[var(--surface-2)] border-b border-[var(--line-soft)] font-mono text-xs font-semibold">
                      {archivo.nombreArchivo}
                    </header>
                    <ArchivoTexto nombreArchivo={archivo.nombreArchivo} datos={archivo.datos} />
                  </article>
                ))
              ) : (
                <p className="muted text-center py-8">
                  No hay archivos individuales para mostrar.
                </p>
              )}
            </div>

            <footer className="modal-foot">
              <button
                type="button"
                onClick={() => setShowArchivosJson(false)}
                className="btn btn-ghost"
              >
                Cerrar
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* MODAL REVISIÓN DUCA T */}
      {showPreview && parsedData && (
        <div className="modal" onClick={() => setShowPreview(false)}>
          <div
            className="modal-box lg"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="duca-preview-title"
          >
            <header className="modal-head">
              <div className="flex-1">
                <h2 id="duca-preview-title">Revisión de la Declaración DUCA-T</h2>
                <p>Valida y corrige los 9 pasos antes de enviarla a SIECA.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="btn btn-quiet btn-sm"
                aria-label="Cerrar revisión DUCA-T"
              >
                <CloseIcon />
              </button>
            </header>

            <div className="modal-body">
              <DucaPreviewForm
                key={JSON.stringify(parsedData)}
                data={parsedData}
                onChange={handleDataChange}
                hasDiscrepancies={hasDiscrepancies}
                discrepancyDetails={discrepancyDetails}
              />
            </div>

            <footer className="modal-foot">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="btn btn-ghost"
              >
                Cerrar revisión
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* CONSOLA FLOTANTE */}
      <ActivityConsole logs={auditLog} />
    </main>
  );
}
