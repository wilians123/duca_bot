"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { AuditEntry, createAuditEntry, initialAuditEntry } from "@/lib/audit";
import { DucaPreviewForm, DucaDataState } from "@/components/DucaPreviewForm";

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
      <div className="max-h-96 overflow-auto bg-white p-3">
        <table className="min-w-full border-collapse text-left text-xs text-slate-800">
          <tbody>
            {filas.map((fila, filaIndice) => (
              <tr key={filaIndice} className={filaIndice === 0 ? "bg-cyan-50 font-semibold" : "odd:bg-slate-50"}>
                {fila.map((celda, celdaIndice) => (
                  <td key={celdaIndice} className="border border-slate-200 px-2 py-1 align-top whitespace-pre-wrap">
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

  return <pre className="max-h-96 overflow-auto whitespace-pre-wrap bg-slate-950 p-4 text-xs leading-6 text-emerald-200">{texto}</pre>;
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

export default function Home() {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([initialAuditEntry]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [jsonPreview, setJsonPreview] = useState("");
  const [parsedData, setParsedData] = useState<DucaDataState | null>(null);
  const [hasDiscrepancies, setHasDiscrepancies] = useState(false);
  const [discrepancyDetails, setDiscrepancyDetails] = useState<string | null>(
    null,
  );
  const [showPreview, setShowPreview] = useState(false);
  const [showArchivosJson, setShowArchivosJson] = useState(false);

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [archivosJson, setArchivosJson] = useState<
    { nombreArchivo: string; datos: unknown }[]
  >([]);

  // Estados para la integración con Gmail
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);
  const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>([]);
  const [selectedMailId, setSelectedMailId] = useState("");
  const [selectedAttachmentIndexes, setSelectedAttachmentIndexes] = useState<
    Record<string, number[]>
  >({});
  const [correoEnVista, setCorreoEnVista] = useState<string | null>(null);
  const [isLoadingMails, setIsLoadingMails] = useState(false);

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
      setJsonPreview(JSON.stringify(extractedData, null, 2));
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
    setJsonPreview(JSON.stringify(newData, null, 2));
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[340px_1fr]">
        <aside className="border-b border-slate-200 bg-slate-950 p-6 text-white lg:border-b-0 lg:border-r">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              DUCA-T RPA
            </p>
            <h1 className="mt-2 text-2xl font-semibold">
              Log de Auditoria del Sistema
            </h1>
          </div>

          <div className="h-[42vh] overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-3 lg:h-[calc(100vh-132px)]">
            <div className="space-y-3">
              {auditLog.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-md border border-white/10 bg-slate-900 p-3 shadow-sm"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span
                      className={`text-xs font-bold uppercase ${
                        entry.level === "success"
                          ? "text-emerald-300"
                          : entry.level === "error"
                            ? "text-rose-300"
                            : "text-cyan-300"
                      }`}
                    >
                      {entry.level}
                    </span>
                    <time className="font-mono text-xs text-slate-400">
                      {entry.time}
                    </time>
                  </div>
                  <p className="text-sm leading-6 text-slate-100">
                    {entry.message}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </aside>

        <section className="px-5 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  Automatizacion de declaraciones aduaneras DUCA-T
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={connectGmail}
                  disabled={isConnectingGmail}
                  className="h-11 rounded-md bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isConnectingGmail ? "Conectando..." : "Conectar Gmail"}
                </button>
              </div>
            </div>

            <div className="grid gap-5">
              {/* TARJETA 1: AUTENTICACIÓN LOGIN SIECA */}
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="mt-1 text-xl font-semibold">
                      Autenticacion Login SIECA
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Ejecutar BOT con Playwright.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={authenticate}
                    disabled={isAuthenticating}
                    className="h-11 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {isAuthenticating
                      ? "Esperando login..."
                      : "Abrir Navegador para Login"}
                  </button>
                </div>
              </section>

              {/* TARJETA 2: EXTRACCIÓN Y LIMPIEZA IA */}
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="mt-1 text-xl font-semibold">
                    Extraccion y Limpieza IA
                  </h3>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={fetchGmailMessages}
                      disabled={isLoadingMails}
                      className="h-11 w-full rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {isLoadingMails ? "Cargando..." : "Listar Correos"}
                    </button>
                    {gmailMessages.length > 0 && (
                      <div className="max-h-80 space-y-2 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-2">
                        {gmailMessages.map((msg) => (
                          <article
                            key={msg.id}
                            className={`rounded-md border p-3 ${selectedMailId === msg.id ? "border-cyan-600 bg-cyan-50" : "border-slate-200 bg-white"}`}
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMailId(msg.id);
                                  setPdfFile(null);
                                  setSelectedAttachmentIndexes((previous) =>
                                    previous[msg.id]
                                      ? previous
                                      : {
                                          ...previous,
                                          [msg.id]: msg.archivosAdjuntos.map(
                                            (_, index) => index,
                                          ),
                                        },
                                  );
                                }}
                                className="min-w-0 text-left"
                              >
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {msg.subject}
                                </p>
                                <p className="truncate text-xs text-slate-600">
                                  [{new Date(msg.date).toLocaleDateString()}]{" "}
                                  {msg.from}
                                </p>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setCorreoEnVista(
                                    correoEnVista === msg.id ? null : msg.id,
                                  )
                                }
                                className="shrink-0 rounded-md bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-950"
                              >
                                ver_correo
                              </button>
                            </div>
                            {selectedMailId === msg.id && (
                              <div className="mt-3 border-t border-slate-200 pt-3">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-700">
                                  Archivos adjuntos ({msg.archivosAdjuntos.length})
                                </p>
                                <ul className="space-y-1 text-xs text-slate-700">
                                  {msg.archivosAdjuntos.length > 0 ? (
                                    msg.archivosAdjuntos.map((nombre, index) => (
                                      <li
                                        key={`${nombre}-${index}`}
                                        className="rounded bg-slate-100 px-2 py-1 font-mono"
                                      >
                                        <label className="flex items-center gap-2">
                                          <input
                                            type="checkbox"
                                            checked={selectedAttachmentIndexes[msg.id]?.includes(index) ?? false}
                                            onChange={(event) =>
                                              setSelectedAttachmentIndexes((previous) => {
                                                const selected = previous[msg.id] || [];
                                                return {
                                                  ...previous,
                                                  [msg.id]: event.target.checked
                                                    ? [...selected, index]
                                                    : selected.filter((selectedIndex) => selectedIndex !== index),
                                                };
                                              })
                                            }
                                            className="rounded border-slate-300 text-cyan-700 focus:ring-cyan-600"
                                          />
                                          <span>{nombre}</span>
                                        </label>
                                      </li>
                                    ))
                                  ) : (
                                    <li>No hay adjuntos.</li>
                                  )}
                                </ul>
                              </div>
                            )}
                            {correoEnVista === msg.id && (
                              <div className="mt-3 border-t border-slate-200 pt-3">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-700">
                                  Cuerpo del correo
                                </p>
                                <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-slate-950 p-3 text-xs leading-5 text-slate-100">
                                  {msg.cuerpo ||
                                    "El correo no contiene texto plano."}
                                </pre>
                              </div>
                            )}
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Archivos locales (Alternativo)
                    </span>
                    <input
                      type="file"
                      accept="application/pdf,.pdf,.xls,.xlsx"
                      onChange={handleFileChange}
                      className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-cyan-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-cyan-800"
                    />
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={extractData}
                      disabled={!canExtract}
                      className="h-11 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {isExtracting ? "Extrayendo..." : "Extraer Datos"}
                    </button>
                    {parsedData && (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowPreview(!showPreview)}
                          className="h-11 rounded-md bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700"
                        >
                          Previsualización
                        </button>
                        <button
                          type="button"
                          aria-pressed={showArchivosJson}
                          onClick={() =>
                            setShowArchivosJson((visible) => !visible)
                          }
                          className={`h-11 rounded-md px-4 text-sm font-semibold text-white transition ${showArchivosJson ? "bg-slate-950" : "bg-slate-700 hover:bg-slate-800"}`}
                        >
                          archivos_json
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {showArchivosJson && (
                  <section className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-cyan-700">
                        Archivos JSON individuales
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-950">
                        Extracción asociada por nombre original
                      </h3>
                    </div>
                    <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2">
                      {archivosJson.length > 0 ? (
                        archivosJson.map((archivo, indice) => (
                          <article
                            key={`${archivo.nombreArchivo}-${indice}`}
                            className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm"
                          >
                            <header className="border-b border-slate-200 bg-slate-100 px-4 py-3 font-mono text-sm font-semibold text-slate-900">
                              {archivo.nombreArchivo}
                            </header>
                            <ArchivoTexto nombreArchivo={archivo.nombreArchivo} datos={archivo.datos} />
                          </article>
                        ))
                      ) : (
                        <p className="rounded-md border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                          No hay archivos JSON individuales disponibles para
                          esta extracción.
                        </p>
                      )}
                    </div>
                  </section>
                )}

                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    JSON resultante
                  </span>
                  <textarea
                    readOnly
                    value={jsonPreview}
                    placeholder="El JSON limpio aparecera aqui despues de procesar el correo o PDF."
                    className="min-h-72 w-full resize-y rounded-md border border-slate-300 bg-slate-950 p-4 font-mono text-xs leading-6 text-emerald-200 outline-none"
                  />
                </label>
              </section>

              {/* TARJETA 2.5: PREVISUALIZAR DUCA T */}
              {showPreview && parsedData && (
                <section className="rounded-lg border border-indigo-200 bg-white p-5 shadow-sm">
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-indigo-700">
                      Previsualización Editable
                    </p>
                    <h3 className="mt-1 text-xl font-semibold">
                      Previsualizar DUCA T
                    </h3>
                  </div>

                  <DucaPreviewForm
                    data={parsedData}
                    onChange={handleDataChange}
                    hasDiscrepancies={hasDiscrepancies}
                    discrepancyDetails={discrepancyDetails}
                  />

                  {hasDiscrepancies && (
                    <div className="mt-4">
                      <button
                        onClick={() => setHasDiscrepancies(false)}
                        className="h-11 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                      >
                        Aprobar y Resolver Discrepancias
                      </button>
                    </div>
                  )}
                </section>
              )}

            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
