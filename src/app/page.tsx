"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { addDoc, collection } from "firebase/firestore";
import { AuditEntry, createAuditEntry, initialAuditEntry } from "@/lib/audit";
import {
  DucaPreviewForm,
  DucaDataState,
} from "@/components/operator/DucaPreviewForm";
import { ActivityConsole } from "@/components/operator/ActivityConsole";
import { useAuth } from "@/components/auth/AuthProvider";
import { camposFaltantes } from "@/lib/duca-requeridos";
import { db } from "../../firebase/client";

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

type AutomationState = {
  status: string;
  step: string;
  pauseReason: string;
  numeroDuca?: string;
};

type PersistedFlowState = {
  parsedData?: DucaDataState | null;
  hasDiscrepancies?: boolean;
  discrepancyDetails?: string | null;
  automationId?: string | null;
  automationState?: AutomationState | null;
  ducaNumber?: string;
  isAuthenticating?: boolean;
  selectedMailId?: string;
  selectedAttachmentIndexes?: Record<string, number[]>;
  archivosJson?: { nombreArchivo: string; datos: unknown }[];
  localFileNames?: string[];
  sourceMode?: "gmail" | "local" | "none";
};

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function firstText(value: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const item = value[key];
    if (typeof item === "string" || typeof item === "number")
      return String(item);
  }
  return "";
}

function automationStep(data: Record<string, unknown>): string {
  const stepKeys = [
    "step",
    "paso",
    "current_step",
    "paso_actual",
    "paso_en_curso",
    "pasoEnCurso",
    "currentStep",
    "pasoActual",
    "step_name",
    "stepName",
    "current_stage",
    "currentStage",
    "stage",
    "etapa",
    "fase",
    "current_phase",
    "currentPhase",
    "current_action",
    "currentAction",
    "accion_actual",
    "accionActual",
    "acción_actual",
    "current_task",
    "currentTask",
    "tarea_actual",
    "task",
    "action",
  ];
  const pending = [data];
  const visited = new Set<Record<string, unknown>>();

  while (pending.length > 0) {
    const current = pending.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const key of stepKeys) {
      const step = current[key];
      if (typeof step === "string" && step.trim()) return step;
      if (typeof step === "number") return String(step);
      if (typeof step === "object" && step !== null) {
        const stepObject = asObject(step);
        const label = firstText(stepObject, [
          "name",
          "nombre",
          "title",
          "titulo",
          "label",
          "etapa",
          "fase",
          "description",
          "descripcion",
        ]);
        if (label) return label;
      }
    }

    for (const [, value] of Object.entries(current)) {
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        pending.push(value as Record<string, unknown>);
      }
    }
  }
  return "";
}

function parseAutomationState(value: unknown): AutomationState {
  const data = asObject(value);
  const result = asObject(data.result ?? data.data ?? data.resultado);
  const numeroDuca =
    firstText(data, [
      "numero_duca",
      "numeroDuca",
      "numeroDUCA",
      "duca_number",
      "ducaNumber",
      "numero_declaracion",
      "numeroDeclaracion",
      "declaration_number",
    ]) ||
    firstText(result, [
      "numero_duca",
      "numeroDuca",
      "numeroDUCA",
      "duca_number",
      "ducaNumber",
      "numero_declaracion",
      "numeroDeclaracion",
      "declaration_number",
    ]);
  return {
    status: firstText(data, ["status", "estado", "state"]) || "iniciando",
    step: automationStep(data),
    pauseReason: firstText(data, [
      "pause_reason",
      "pauseReason",
      "motivo_pausa",
      "motivoPausa",
      "reason",
    ]),
    numeroDuca,
  };
}

function automationStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    queued: "En cola",
    pending: "En cola",
    starting: "Iniciando",
    running: "En ejecución",
    en_ejecucion: "En ejecución",
    en_proceso: "En proceso",
    procesando: "En proceso",
    pausado: "Pausado",
    paused: "Pausado",
    revision_final: "Revisión final",
    completed: "Finalizado",
    finalizado: "Finalizado",
    success: "Finalizado",
    error: "Error",
    failed: "Error",
    cancelado: "Cancelado",
    cancelled: "Cancelado",
    canceled: "Cancelado",
  };
  return labels[status.toLowerCase()] || status;
}

function automationTerminal(status: string): boolean {
  return [
    "completed",
    "finalizado",
    "success",
    "error",
    "failed",
    "cancelado",
    "cancelled",
    "canceled",
  ].includes(status.toLowerCase());
}

function openFlowFileDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open("duca-bot-flow-files", 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("pdfs"))
        request.result.createObjectStore("pdfs");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveFlowFiles(uid: string, files: File[]): Promise<void> {
  const database = await openFlowFileDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction("pdfs", "readwrite");
    const store = transaction.objectStore("pdfs");
    if (files.length > 0) store.put(files, uid);
    else store.delete(uid);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  }).finally(() => database.close());
}

async function loadFlowFiles(uid: string): Promise<File[]> {
  const database = await openFlowFileDatabase();
  return new Promise<File[]>((resolve, reject) => {
    const transaction = database.transaction("pdfs", "readonly");
    const request = transaction.objectStore("pdfs").get(uid);
    request.onsuccess = () => {
      const stored = request.result;
      if (Array.isArray(stored))
        resolve(stored.filter((file): file is File => file instanceof File));
      else if (stored instanceof File) resolve([stored]);
      else if (stored instanceof Blob)
        resolve([
          new File([stored], "documento.pdf", { type: "application/pdf" }),
        ]);
      else resolve([]);
    };
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

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

function ArchivoTexto({
  nombreArchivo,
  datos,
}: {
  nombreArchivo: string;
  datos: unknown;
}) {
  const texto = typeof datos === "string" ? datos : String(datos ?? "");
  const esTabla = /\.(xls|xlsx)$/i.test(nombreArchivo) && texto.includes("\n");
  const filas = esTabla
    ? texto.split(/\r?\n/).filter(Boolean).map(separarCsv)
    : [];

  if (esTabla && filas.length > 0) {
    return (
      <div className="table-wrap max-h-96 overflow-auto">
        <table>
          <tbody>
            {filas.map((fila, filaIndice) => (
              <tr
                key={filaIndice}
                className={
                  filaIndice === 0 ? "font-semibold bg-[var(--surface-2)]" : ""
                }
              >
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
    <pre
      className="mono max-h-96 overflow-auto p-4 text-xs leading-6"
      style={{ background: "#0F1C33", color: "#9FE8C8" }}
    >
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
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-4 h-4 flex-none"
    >
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-4 h-4 flex-none"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-4 h-4 flex-none"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function WarnIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-5 h-5 flex-none text-[var(--warn)]"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-5 h-5 flex-none"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
function ClipIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-3.5 h-3.5 flex-none"
    >
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-4 h-4 flex-none"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-5 h-5 flex-none"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function GmailSkeleton() {
  return (
    <div
      className="gmail-skeleton"
      aria-label="Cargando correos"
      aria-busy="true"
    >
      <div className="gmail-skeleton-list">
        {Array.from({ length: 5 }, (_, index) => (
          <div className="gmail-skeleton-row" key={index}>
            <span className="gmail-skeleton-avatar" />
            <span className="gmail-skeleton-copy">
              <span className="gmail-skeleton-line gmail-skeleton-line-wide" />
              <span className="gmail-skeleton-line gmail-skeleton-line-medium" />
              <span className="gmail-skeleton-line gmail-skeleton-line-short" />
            </span>
          </div>
        ))}
      </div>
      <div className="gmail-skeleton-reader">
        <span className="gmail-skeleton-line gmail-skeleton-title" />
        <span className="gmail-skeleton-line gmail-skeleton-line-wide" />
        <span className="gmail-skeleton-line gmail-skeleton-line-medium" />
        <div className="gmail-skeleton-message">
          <span className="gmail-skeleton-avatar" />
          <span className="gmail-skeleton-copy">
            <span className="gmail-skeleton-line gmail-skeleton-line-wide" />
            <span className="gmail-skeleton-line gmail-skeleton-line-wide" />
            <span className="gmail-skeleton-line gmail-skeleton-line-medium" />
            <span className="gmail-skeleton-line gmail-skeleton-line-short" />
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { profile, firebaseUser } = useAuth();
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([initialAuditEntry]);
  const localFilesInputRef = useRef<HTMLInputElement | null>(null);
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const [parsedData, setParsedData] = useState<DucaDataState | null>(null);
  const [hasDiscrepancies, setHasDiscrepancies] = useState(false);
  const [discrepancyDetails, setDiscrepancyDetails] = useState<string | null>(
    null,
  );
  const [showPreview, setShowPreview] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [previewDraft, setPreviewDraft] = useState<DucaDataState | null>(null);
  const [hasPreviewDraftChanges, setHasPreviewDraftChanges] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [automationId, setAutomationId] = useState<string | null>(null);
  const [automationState, setAutomationState] =
    useState<AutomationState | null>(null);
  const [ducaNumber, setDucaNumber] = useState("");
  const [flowStateRestored, setFlowStateRestored] = useState(false);
  const [isAutomationActionBusy, setIsAutomationActionBusy] = useState(false);
  const historySavedAutomationIds = useRef(new Set<string>());
  const lastAutomationStateRef = useRef("");
  const restoredFlowStateKey = useRef("");
  const [showArchivosJson, setShowArchivosJson] = useState(false);

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [archivosJson, setArchivosJson] = useState<
    { nombreArchivo: string; datos: unknown }[]
  >([]);

  // Estados para Gmail
  const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>([]);
  const [selectedMailId, setSelectedMailId] = useState("");
  const [selectedAttachmentIndexes, setSelectedAttachmentIndexes] = useState<
    Record<string, number[]>
  >({});
  const [isLoadingMails, setIsLoadingMails] = useState(false);
  const [hasLoadedGmail, setHasLoadedGmail] = useState(false);
  const [gmailFlowStarted, setGmailFlowStarted] = useState(false);
  const [gmailLinkMessage, setGmailLinkMessage] = useState("");
  const [mailLimit, setMailLimit] = useState(30);
  const [mailFilterQuery, setMailFilterQuery] = useState("");
  const [onlyMessagesWithAttachments, setOnlyMessagesWithAttachments] =
    useState(false);
  const autoGmailRedirectUid = useRef("");
  const gmailCacheKey = profile?.uid
    ? `gmail-messages-cache:${profile.uid}`
    : "";
  const gmailFlowKey = profile?.uid ? `gmail-flow-started:${profile.uid}` : "";
  const flowStateKey = profile?.uid ? `duca-flow-state:${profile.uid}` : "";

  useEffect(() => {
    if (!flowStateKey) return;
    const restoreFlowState = window.setTimeout(() => {
      void (async () => {
        try {
          const stored = window.sessionStorage.getItem(flowStateKey);
          if (!stored) return;

          const snapshot = JSON.parse(stored) as PersistedFlowState;
          if (snapshot.parsedData && typeof snapshot.parsedData === "object") {
            setParsedData(snapshot.parsedData);
          }
          setHasDiscrepancies(snapshot.hasDiscrepancies === true);
          setDiscrepancyDetails(
            typeof snapshot.discrepancyDetails === "string"
              ? snapshot.discrepancyDetails
              : null,
          );
          setSelectedMailId(
            typeof snapshot.selectedMailId === "string"
              ? snapshot.selectedMailId
              : "",
          );
          setArchivosJson(
            Array.isArray(snapshot.archivosJson) ? snapshot.archivosJson : [],
          );
          if (
            snapshot.selectedAttachmentIndexes &&
            typeof snapshot.selectedAttachmentIndexes === "object"
          ) {
            setSelectedAttachmentIndexes(snapshot.selectedAttachmentIndexes);
          }
          if (!snapshot.selectedMailId && profile?.uid) {
            try {
              const restoredFiles = await loadFlowFiles(profile.uid);
              if (restoredFiles.length > 0) {
                const limitedFiles = restoredFiles.slice(0, 15);
                setLocalFiles(limitedFiles);
                if (limitedFiles.length !== restoredFiles.length)
                  void saveFlowFiles(profile.uid, limitedFiles).catch(
                    () => undefined,
                  );
              }
            } catch {
              // No se impide recuperar la automatización si el navegador bloquea IndexedDB.
            }
          }

          const restoredAutomationId =
            typeof snapshot.automationId === "string"
              ? snapshot.automationId
              : null;
          const restoredState =
            snapshot.automationState &&
            typeof snapshot.automationState.status === "string"
              ? snapshot.automationState
              : null;
          setAutomationId(restoredAutomationId);
          setAutomationState(restoredState);
          setDucaNumber(
            typeof snapshot.ducaNumber === "string" ? snapshot.ducaNumber : "",
          );
          const shouldResumePolling = Boolean(
            restoredAutomationId &&
            (!restoredState || !automationTerminal(restoredState.status)),
          );
          setIsAuthenticating(shouldResumePolling);
          lastAutomationStateRef.current = restoredState
            ? `${restoredState.status}|${restoredState.step}|${restoredState.pauseReason}`
            : "";
        } catch {
          window.sessionStorage.removeItem(flowStateKey);
        } finally {
          restoredFlowStateKey.current = flowStateKey;
          setFlowStateRestored(true);
        }
      })();
    }, 0);
    return () => window.clearTimeout(restoreFlowState);
  }, [flowStateKey, profile?.uid]);

  useEffect(() => {
    if (
      !flowStateRestored ||
      !flowStateKey ||
      restoredFlowStateKey.current !== flowStateKey
    )
      return;
    const snapshot: PersistedFlowState = {
      parsedData,
      hasDiscrepancies,
      discrepancyDetails,
      automationId,
      automationState,
      ducaNumber,
      isAuthenticating,
      selectedMailId,
      selectedAttachmentIndexes,
      archivosJson,
      localFileNames: localFiles.map((file) => file.name),
      sourceMode:
        localFiles.length > 0 ? "local" : selectedMailId ? "gmail" : "none",
    };
    try {
      window.sessionStorage.setItem(flowStateKey, JSON.stringify(snapshot));
    } catch {
      // El flujo actual sigue funcionando si el almacenamiento del navegador no está disponible.
    }
  }, [
    flowStateRestored,
    flowStateKey,
    parsedData,
    hasDiscrepancies,
    discrepancyDetails,
    automationId,
    automationState,
    ducaNumber,
    isAuthenticating,
    selectedMailId,
    selectedAttachmentIndexes,
    archivosJson,
    localFiles,
  ]);

  useEffect(() => {
    const updateMessage = window.setTimeout(() => {
      const result = new URLSearchParams(window.location.search).get("gmail");
      if (result === "already-linked") {
        setGmailLinkMessage(
          "Este correo de Gmail ya pertenece a otro usuario. No se vinculó; elige otra cuenta para continuar.",
        );
      }
    }, 0);
    return () => window.clearTimeout(updateMessage);
  }, []);

  useEffect(() => {
    if (!profile?.uid || !gmailCacheKey || !gmailFlowKey) return;
    const restoreFlow = window.setTimeout(() => {
      setGmailMessages([]);
      setSelectedMailId("");
      setSelectedAttachmentIndexes({});
      setHasLoadedGmail(false);
      window.sessionStorage.removeItem("gmail-messages-cache");
      window.sessionStorage.removeItem("gmail-flow-started");
      if (window.sessionStorage.getItem(gmailFlowKey) === "true") {
        setGmailFlowStarted(true);
      }

      const cachedMessages = window.sessionStorage.getItem(gmailCacheKey);
      if (!cachedMessages) return;

      try {
        const messages = JSON.parse(cachedMessages) as GmailMessage[];
        if (!Array.isArray(messages)) return;
        setGmailMessages(messages);
        setHasLoadedGmail(true);
        setGmailFlowStarted(true);
        let savedFlowState: PersistedFlowState = {};
        try {
          const serializedFlowState =
            window.sessionStorage.getItem(flowStateKey);
          if (serializedFlowState)
            savedFlowState = JSON.parse(
              serializedFlowState,
            ) as PersistedFlowState;
        } catch {
          // El flujo de Gmail se restaura aunque el estado del trámite no sea válido.
        }
        const defaultIndexes = Object.fromEntries(
          messages.map((message) => [
            message.id,
            message.archivosAdjuntos.slice(0, 15).map((_, index) => index),
          ]),
        );
        const restoredMailId =
          savedFlowState.sourceMode === "local" ||
          savedFlowState.sourceMode === "none" ||
          (savedFlowState.localFileNames?.length || 0) > 0
            ? ""
            : savedFlowState.selectedMailId &&
                messages.some(
                  (message) => message.id === savedFlowState.selectedMailId,
                )
              ? savedFlowState.selectedMailId
              : messages[0]?.id || "";
        setSelectedMailId(restoredMailId);
        const restoredIndexes = Object.fromEntries(
          Object.entries(savedFlowState.selectedAttachmentIndexes || {}).map(
            ([id, indexes]) => [id, indexes.slice(0, 15)],
          ),
        );
        setSelectedAttachmentIndexes({ ...defaultIndexes, ...restoredIndexes });
      } catch {
        window.sessionStorage.removeItem(gmailCacheKey);
      }
    }, 0);
    return () => window.clearTimeout(restoreFlow);
  }, [flowStateKey, gmailCacheKey, gmailFlowKey, profile?.uid]);

  useEffect(() => {
    if (
      !profile?.uid ||
      profile.role !== "user" ||
      autoGmailRedirectUid.current === profile.uid
    )
      return;
    const redirectResult = new URLSearchParams(window.location.search).get(
      "gmail",
    );
    if (redirectResult && redirectResult !== "connected") return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (autoGmailRedirectUid.current === profile.uid) return;
      autoGmailRedirectUid.current = profile.uid;
      void (async () => {
        try {
          const idToken = await firebaseUser?.getIdToken();
          if (!idToken) return;
          const headers = { Authorization: `Bearer ${idToken}` };
          const statusResponse = await fetch("/api/auth/gmail", {
            headers,
            cache: "no-store",
          });
          const connection = (await statusResponse.json()) as {
            connected?: boolean;
          };
          if (cancelled || !statusResponse.ok || connection.connected) return;
          const connectResponse = await fetch("/api/auth/gmail", {
            method: "POST",
            headers,
            cache: "no-store",
          });
          const connectPayload = (await connectResponse.json()) as {
            url?: string;
          };
          if (cancelled || !connectResponse.ok || !connectPayload.url) return;
          window.location.assign(connectPayload.url);
        } catch {
          // La conexión se puede iniciar manualmente desde la pantalla de conexiones.
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [firebaseUser, profile?.role, profile?.uid]);

  const canExtract = useMemo(
    () =>
      Boolean(
        (localFiles.length > 0 || selectedMailId) &&
        (!selectedMailId || selectedAttachmentIndexes[selectedMailId]?.length),
      ) &&
      !isExtracting &&
      !isAuthenticating,
    [
      localFiles,
      selectedMailId,
      selectedAttachmentIndexes,
      isExtracting,
      isAuthenticating,
    ],
  );

  const pushLog = useCallback(
    (message: string, level: AuditEntry["level"] = "info") => {
      setAuditLog((entries) => [createAuditEntry(message, level), ...entries]);
    },
    [],
  );

  useEffect(() => {
    if (
      !flowStateRestored ||
      restoredFlowStateKey.current !== flowStateKey ||
      !automationId ||
      !isAuthenticating
    )
      return;
    let disposed = false;
    let timer: number | undefined;
    const poll = async () => {
      if (disposed) return;
      try {
        const response = await fetch(
          `/api/automation/${encodeURIComponent(automationId)}`,
          { cache: "no-store" },
        );
        const payload = asObject(await response.json());
        if (!response.ok) {
          const error = asObject(payload.error);
          throw new ApiRequestError(
            firstText(error, ["codigo"]) || "AUTOMATION_UNKNOWN_ERR",
            firstText(error, ["mensaje"]) ||
              "No se pudo consultar la automatización.",
          );
        }
        const nextState = parseAutomationState(payload);
        setAutomationState(nextState);
        if (nextState.numeroDuca)
          setDucaNumber((current) => current || nextState.numeroDuca || "");
        const signature = `${nextState.status}|${nextState.step}|${nextState.pauseReason}`;
        if (signature !== lastAutomationStateRef.current) {
          if (
            nextState.status !== lastAutomationStateRef.current.split("|")[0]
          ) {
            pushLog(
              `Automatización: ${automationStatusLabel(nextState.status)}.`,
            );
          }
          const previousStep = lastAutomationStateRef.current.split("|")[1];
          if (nextState.step && nextState.step !== previousStep)
            pushLog(`Paso actual: ${nextState.step}.`);
          const previousPause = lastAutomationStateRef.current.split("|")[2];
          if (
            nextState.pauseReason &&
            nextState.pauseReason !== previousPause
          ) {
            pushLog(`Automatización en pausa: ${nextState.pauseReason}.`);
          } else if (!nextState.pauseReason && previousPause) {
            pushLog("La automatización continuó después de la pausa.");
          }
          lastAutomationStateRef.current = signature;
        }
        if (automationTerminal(nextState.status)) {
          setIsAuthenticating(false);
          return;
        }
      } catch (error) {
        if (disposed) return;
        const message =
          error instanceof ApiRequestError
            ? `[${error.codigo}] ${error.message}`
            : error instanceof Error
              ? error.message
              : "Error al consultar la automatización.";
        pushLog(message, "error");
        setAutomationState({ status: "error", step: "", pauseReason: "" });
        setIsAuthenticating(false);
        return;
      }
      if (!disposed) timer = window.setTimeout(poll, 2000);
    };
    void poll();
    return () => {
      disposed = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [
    automationId,
    flowStateKey,
    flowStateRestored,
    isAuthenticating,
    pushLog,
  ]);

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

  const connectGmail = async () => {
    try {
      setGmailFlowStarted(true);
      if (gmailFlowKey) window.sessionStorage.setItem(gmailFlowKey, "true");
      pushLog("Redirigiendo a Google para autorizar acceso a Gmail...");
      const idToken = await firebaseUser?.getIdToken();
      const response = await fetch("/api/auth/gmail", {
        method: "POST",
        headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !payload.url)
        throw new Error(
          payload.error || "No se pudo iniciar la conexión con Gmail.",
        );
      window.location.assign(payload.url);
    } catch (error) {
      pushLog(
        error instanceof Error ? error.message : "No se pudo conectar Gmail.",
        "error",
      );
    }
  };

  const fetchGmailMessages = async () => {
    setGmailFlowStarted(true);
    setHasLoadedGmail(false);
    setIsLoadingMails(true);
    pushLog("Consultando bandeja de entrada de Gmail...");

    try {
      const idToken = await firebaseUser?.getIdToken();
      const response = await fetch("/api/gmail/list", {
        headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
        cache: "no-store",
      });
      const payload = await handleApiResponse(response);
      const messages = (payload.data as GmailMessage[]) || [];
      try {
        if (gmailCacheKey)
          window.sessionStorage.setItem(
            gmailCacheKey,
            JSON.stringify(messages),
          );
      } catch {
        // La carga de correos debe continuar aunque el almacenamiento de sesión no esté disponible.
      }
      setGmailMessages(messages);
      if (messages.length > 0 && !selectedMailId && localFiles.length === 0) {
        setSelectedMailId(messages[0].id);
      }
      setSelectedAttachmentIndexes(
        Object.fromEntries(
          messages.map((message) => [
            message.id,
            message.archivosAdjuntos.slice(0, 15).map((_, index) => index),
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
      setHasLoadedGmail(true);
    }
  };

  const authenticate = async () => {
    if (!parsedData) return;
    if (hasDiscrepancies) {
      pushLog("Aprueba las discrepancias antes de enviar", "error");
      return;
    }
    const faltantes = camposFaltantes(parsedData);
    if (faltantes.length > 0) {
      setMissingFields(faltantes);
      pushLog(`Faltan campos requeridos: ${faltantes.join(", ")}`, "error");
      return;
    }

    setAutomationId(null);
    setIsAuthenticating(true);
    setMissingFields([]);
    setAutomationState({ status: "iniciando", step: "", pauseReason: "" });
    setDucaNumber("");
    lastAutomationStateRef.current = "";
    pushLog("Enviando la DUCA-T a la automatización...");

    try {
      const formData = new FormData();
      formData.append("datos", JSON.stringify(parsedData));
      if (localFiles.length > 0) {
        for (const file of localFiles)
          formData.append("files", file, file.name);
      } else if (selectedMailId) {
        formData.append("mailId", selectedMailId);
        formData.append(
          "selectedAttachmentIndexes",
          JSON.stringify(selectedAttachmentIndexes[selectedMailId] || []),
        );
      }
      const idToken = selectedMailId
        ? await firebaseUser?.getIdToken()
        : undefined;
      const response = await fetch("/api/automation/start", {
        method: "POST",
        body: formData,
        headers:
          selectedMailId && idToken
            ? { Authorization: `Bearer ${idToken}` }
            : undefined,
      });
      const payload = asObject(await response.json());
      if (!response.ok) {
        const error = asObject(payload.error);
        throw new ApiRequestError(
          firstText(error, ["codigo"]) || "AUTOMATION_UNKNOWN_ERR",
          firstText(error, ["mensaje"]) ||
            firstText(payload, ["message"]) ||
            "No se pudo iniciar la automatización.",
          firstText(error, ["detalle"]) || undefined,
        );
      }
      const id = firstText(payload, [
        "id",
        "run_id",
        "runId",
        "automation_id",
        "automationId",
      ]);
      if (!id)
        throw new ApiRequestError(
          "AUTOMATION_INVALID_RESPONSE_ERR",
          "La automatización no devolvió un identificador de ejecución.",
        );
      if (flowStateKey) {
        const snapshot: PersistedFlowState = {
          parsedData,
          hasDiscrepancies,
          discrepancyDetails,
          automationId: id,
          automationState: { status: "iniciando", step: "", pauseReason: "" },
          isAuthenticating: true,
          selectedMailId,
          selectedAttachmentIndexes,
          archivosJson,
          localFileNames: localFiles.map((file) => file.name),
          sourceMode:
            localFiles.length > 0 ? "local" : selectedMailId ? "gmail" : "none",
        };
        try {
          window.sessionStorage.setItem(flowStateKey, JSON.stringify(snapshot));
        } catch {
          // El sondeo continúa aunque el navegador no permita guardar la sesión.
        }
      }
      setAutomationId(id);
      pushLog("Automatización iniciada.", "success");
    } catch (error) {
      pushLog(
        error instanceof ApiRequestError
          ? `[${error.codigo}] ${error.message}${error.detalle ? ` Detalle: ${error.detalle}` : ""}`
          : error instanceof Error
            ? error.message
            : "Error al iniciar la automatización.",
        "error",
      );
      setIsAuthenticating(false);
    }
  };

  const runAutomationAction = async (
    action: "resume" | "cancel",
  ): Promise<boolean> => {
    if (!automationId) return false;
    const isFinalization =
      action === "resume" &&
      automationState?.status.toLowerCase() === "revision_final";
    const finalDucaNumber =
      ducaNumber.trim() || automationState?.numeroDuca || "";
    if (isFinalization && !finalDucaNumber) {
      pushLog(
        "Ingresa el número de DUCA antes de finalizar y guardar el trámite en el historial.",
        "error",
      );
      return false;
    }
    const isFailedRun =
      action === "cancel" &&
      ["error", "failed"].includes(automationState?.status.toLowerCase() || "");
    setIsAutomationActionBusy(true);
    let actionCompleted = false;
    try {
      if (!isFailedRun) {
        const response = await fetch(
          `/api/automation/${encodeURIComponent(automationId)}/${action}`,
          { method: "POST" },
        );
        const payload = asObject(await response.json());
        if (!response.ok) {
          const error = asObject(payload.error);
          throw new ApiRequestError(
            firstText(error, ["codigo"]) || "AUTOMATION_UNKNOWN_ERR",
            firstText(error, ["mensaje"]) ||
              `No se pudo ${action === "resume" ? "continuar" : "cancelar"} la automatización.`,
            firstText(error, ["detalle"]) || undefined,
          );
        }
      }
      actionCompleted = true;
      if (action === "cancel") {
        setAutomationState({ status: "cancelado", step: "", pauseReason: "" });
        setIsAuthenticating(false);
      }
      pushLog(
        isFailedRun
          ? "La grabación fallida se registrará como cancelada."
          : action === "resume"
            ? "Se solicitó continuar la automatización."
            : "Se solicitó cancelar la automatización.",
      );
      if (isFinalization || action === "cancel") {
        if (!profile?.uid)
          throw new Error(
            "No se pudo identificar al usuario para guardar el trámite.",
          );
        if (!historySavedAutomationIds.current.has(automationId)) {
          const paso8 = Object.values(parsedData?.paso8 || {}).flat();
          const numeroBL =
            paso8
              .map((documento) =>
                firstText(asObject(documento), ["NumeroDocumentoManifiestoBL"]),
              )
              .find(Boolean) || "";
          await addDoc(collection(db, "tramites"), {
            userId: profile.uid,
            reference: isFinalization ? finalDucaNumber : "",
            numeroDuca: isFinalization ? finalDucaNumber : "",
            numeroBL,
            numeroContenedor: firstText(asObject(parsedData?.paso9), [
              "NumeroContenedor",
            ]),
            cliente: firstText(asObject(parsedData?.paso3), [
              "NombreImportador",
            ]),
            ruta: [
              firstText(asObject(parsedData?.paso1), ["AduanaInicio"]),
              firstText(asObject(parsedData?.paso1), ["AduanaDestino"]),
            ]
              .filter(Boolean)
              .join(" → "),
            createdAt: new Date().toISOString(),
            status: isFinalization ? "Completado" : "Cancelado",
            automationId,
          });
          historySavedAutomationIds.current.add(automationId);
        }
        pushLog(
          isFinalization
            ? "DUCA guardada en el historial de trámites."
            : "Trámite cancelado y guardado en el historial.",
          "success",
        );
        void saveFlowFiles(profile.uid, []).catch(() => undefined);
      }
      return true;
    } catch (error) {
      pushLog(
        error instanceof ApiRequestError
          ? `[${error.codigo}] ${error.message}${error.detalle ? ` Detalle: ${error.detalle}` : ""}`
          : error instanceof Error
            ? error.message
            : "Error de automatización.",
        "error",
      );
      return action === "cancel" && actionCompleted;
    } finally {
      setIsAutomationActionBusy(false);
    }
  };

  const cancelCurrentFlow = async () => {
    const status = automationState?.status.toLowerCase() || "";
    const shouldCancelAutomation = Boolean(
      automationId &&
      (!automationState ||
        !automationTerminal(status) ||
        ["error", "failed"].includes(status)),
    );
    if (shouldCancelAutomation && !(await runAutomationAction("cancel")))
      return;

    setLocalFiles([]);
    if (localFilesInputRef.current) localFilesInputRef.current.value = "";
    setSelectedMailId("");
    setSelectedAttachmentIndexes({});
    resetExtractedData();
    setMissingFields([]);
    setAutomationId(null);
    setAutomationState(null);
    setDucaNumber("");
    setIsAuthenticating(false);
    setIsAutomationActionBusy(false);
    setShowPreview(false);
    setShowUnsavedDialog(false);
    setPreviewDraft(null);
    setHasPreviewDraftChanges(false);
    setShowArchivosJson(false);
    lastAutomationStateRef.current = "";
    historySavedAutomationIds.current.clear();
    if (flowStateKey) window.sessionStorage.removeItem(flowStateKey);
    if (profile?.uid)
      void saveFlowFiles(profile.uid, []).catch(() => undefined);
    pushLog("Trámite cancelado. Puedes iniciar uno nuevo.", "success");
  };

  const extractData = async () => {
    if (localFiles.length === 0 && !selectedMailId) {
      pushLog(
        "Seleccione un PDF local o un correo de Gmail antes de extraer datos.",
        "error",
      );
      return;
    }
    if (selectedMailId && !selectedAttachmentIndexes[selectedMailId]?.length) {
      pushLog(
        "Seleccione al menos un archivo adjunto para extraer datos.",
        "error",
      );
      return;
    }

    setIsExtracting(true);
    setParsedData(null);
    setShowPreview(false);
    setShowArchivosJson(false);
    pushLog(
      selectedMailId
        ? `Procesando correo de Gmail ID: ${selectedMailId}`
        : `Procesando ${localFiles.length} archivo${localFiles.length === 1 ? "" : "s"} local${localFiles.length === 1 ? "" : "es"}.`,
    );

    try {
      const formData = new FormData();
      if (localFiles.length > 0) {
        for (const file of localFiles)
          formData.append("files", file, file.name);
      }
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
          headers:
            selectedMailId && firebaseUser
              ? { Authorization: `Bearer ${await firebaseUser.getIdToken()}` }
              : undefined,
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
        pushLog(
          "La extraccion termino pero hay discrepancias detectadas.",
          "error",
        );
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
    const incomingFiles = Array.from(event.target.files || []);
    event.target.value = "";
    if (incomingFiles.length === 0) return;
    if (selectedMailId) {
      pushLog(
        "Quita primero la selección de Gmail para cargar archivos locales.",
        "error",
      );
      return;
    }

    const invalidFiles = incomingFiles.filter(
      (file) => !/\.(pdf|xls|xlsx)$/i.test(file.name),
    );
    if (invalidFiles.length > 0) {
      pushLog(
        `Formato no permitido: ${invalidFiles.map((file) => file.name).join(", ")}. Usa PDF, XLS o XLSX.`,
        "error",
      );
    }
    const validFiles = incomingFiles.filter((file) =>
      /\.(pdf|xls|xlsx)$/i.test(file.name),
    );
    const remainingSlots = Math.max(0, 15 - localFiles.length);
    const acceptedFiles = validFiles.slice(0, remainingSlots);
    if (acceptedFiles.length < validFiles.length) {
      pushLog(
        "El lote admite un máximo de 15 archivos. Se agregaron los que cabían en el límite.",
        "error",
      );
    }
    if (acceptedFiles.length === 0) return;

    const updatedFiles = [...localFiles, ...acceptedFiles];
    setLocalFiles(updatedFiles);
    if (profile?.uid)
      void saveFlowFiles(profile.uid, updatedFiles).catch(() => undefined);
    setParsedData(null);
    setArchivosJson([]);
    setHasDiscrepancies(false);
    setDiscrepancyDetails(null);
    pushLog(
      `${acceptedFiles.length} archivo${acceptedFiles.length === 1 ? "" : "s"} local${acceptedFiles.length === 1 ? "" : "es"} agregado${acceptedFiles.length === 1 ? "" : "s"}.`,
    );
  };

  const removeLocalFile = (index: number) => {
    const updatedFiles = localFiles.filter(
      (_, fileIndex) => fileIndex !== index,
    );
    setLocalFiles(updatedFiles);
    if (profile?.uid)
      void saveFlowFiles(profile.uid, updatedFiles).catch(() => undefined);
    resetExtractedData();
  };

  const clearLocalFiles = () => {
    setLocalFiles([]);
    if (profile?.uid)
      void saveFlowFiles(profile.uid, []).catch(() => undefined);
    resetExtractedData();
  };

  const clearEmailSelection = () => {
    if (selectedMailId) {
      setSelectedAttachmentIndexes((current) => ({
        ...current,
        [selectedMailId]: [],
      }));
    }
    setSelectedMailId("");
    resetExtractedData();
  };

  const resetExtractedData = () => {
    setParsedData(null);
    setArchivosJson([]);
    setHasDiscrepancies(false);
    setDiscrepancyDetails(null);
  };

  const handleDataChange = (newData: DucaDataState) => {
    setParsedData(newData);
  };

  const handleDraftChange = (datos: DucaDataState, hayCambios: boolean) => {
    setPreviewDraft(datos);
    setHasPreviewDraftChanges(hayCambios);
  };

  const requestClosePreview = () => {
    if (hasPreviewDraftChanges) {
      setShowUnsavedDialog(true);
      return;
    }
    setShowPreview(false);
    setPreviewDraft(null);
  };

  const saveDraftAndClose = () => {
    if (previewDraft) setParsedData(previewDraft);
    setHasPreviewDraftChanges(false);
    setPreviewDraft(null);
    setShowUnsavedDialog(false);
    setShowPreview(false);
  };

  const discardDraftAndClose = () => {
    setHasPreviewDraftChanges(false);
    setPreviewDraft(null);
    setShowUnsavedDialog(false);
    setShowPreview(false);
  };

  const step1Done = gmailMessages.length > 0;
  const step2Done = Boolean(selectedMailId || localFiles.length > 0);
  const step3Done = Boolean(parsedData);
  const step4Done = Boolean(parsedData && !hasDiscrepancies);
  const step5Done = isAuthenticating;

  const currentStep = !step1Done
    ? 1
    : !step2Done
      ? 2
      : !step3Done
        ? 3
        : !step4Done
          ? 4
          : 5;
  const progressPercent = ((currentStep - 1) / 4) * 100;

  const selectedMail = gmailMessages.find((m) => m.id === selectedMailId);
  const selectedCount = selectedMailId
    ? (selectedAttachmentIndexes[selectedMailId] || []).length
    : 0;
  const selectedAttachmentNames = selectedMail
    ? selectedMail.archivosAdjuntos.filter((_, index) =>
        selectedAttachmentIndexes[selectedMail.id]?.includes(index),
      )
    : [];

  const filteredMessages = gmailMessages.filter((msg) => {
    if (onlyMessagesWithAttachments && msg.archivosAdjuntos.length === 0)
      return false;
    if (!mailFilterQuery) return true;
    const q = mailFilterQuery.toLowerCase();
    return (
      msg.subject.toLowerCase().includes(q) ||
      msg.from.toLowerCase().includes(q) ||
      msg.cuerpo.toLowerCase().includes(q)
    );
  });
  const visibleMessages = filteredMessages.slice(0, mailLimit);
  const showGmailMailbox = gmailFlowStarted || gmailMessages.length > 0;

  return (
    <main className="view">
      {gmailLinkMessage && (
        <div className="alert alert-warn mb-4" role="alert">
          {gmailLinkMessage}
        </div>
      )}
      {/* Encabezado */}
      <div className="page-head">
        <div>
          <h1>Trámite nuevo</h1>
          <p>
            Conecta Gmail, elige el correo con los documentos del embarque y
            extrae los datos para armar la DUCA-T con IA.
          </p>
        </div>
      </div>

      {/* FLOWBAR */}
      <div className="flowbar" aria-label="Progreso del trámite">
        <div className="flow-track">
          <div
            className={`flow-step ${step1Done ? "is-done" : currentStep === 1 ? "is-current" : ""}`}
          >
            <span className="flow-num">{step1Done ? "✓" : "1"}</span>
            <div>
              <b>1. Conectar Gmail</b>
              <small>
                {step1Done ? "Bandeja activa" : "Conecta tu cuenta"}
              </small>
            </div>
          </div>
          <div
            className={`flow-step ${step2Done ? "is-done" : currentStep === 2 ? "is-current" : !step1Done ? "is-locked" : ""}`}
          >
            <span className="flow-num">{step2Done ? "✓" : "2"}</span>
            <div>
              <b>2. Elegir correo</b>
              <small>
                {selectedMail ? "1 conversación" : "Marca los adjuntos"}
              </small>
            </div>
          </div>
          <div
            className={`flow-step ${step3Done ? "is-done" : currentStep === 3 ? "is-current" : !step2Done ? "is-locked" : ""}`}
          >
            <span className="flow-num">{step3Done ? "✓" : "3"}</span>
            <div>
              <b>3. Extraer datos</b>
              <small>{parsedData ? "Datos listos" : "Lectura con IA"}</small>
            </div>
          </div>
          <div
            className={`flow-step ${step4Done ? "is-done" : currentStep === 4 ? "is-current" : !step3Done ? "is-locked" : ""}`}
          >
            <span className="flow-num">{step4Done ? "✓" : "4"}</span>
            <div>
              <b>4. Revisar DUCA T</b>
              <small>
                {hasDiscrepancies ? "Revisar datos" : "9 pasos completos"}
              </small>
            </div>
          </div>
          <div
            className={`flow-step ${step5Done ? "is-done" : currentStep === 5 ? "is-current" : !step3Done ? "is-locked" : ""}`}
          >
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
      {!showGmailMailbox ? (
        <section
          className="card p-8 text-center"
          style={{
            minHeight: 280,
            display: "grid",
            placeContent: "center",
            gap: "1rem",
          }}
        >
          <div
            className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: "var(--primary-soft)",
              color: "var(--primary)",
            }}
          >
            <MailIcon />
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              Conecta tu bandeja de entrada
            </h2>
            <p className="muted mt-1 max-w-md mx-auto text-sm">
              Conecta tu correo institucional de Gmail para recibir y procesar
              automáticamente los documentos de embarque de los clientes.
            </p>
          </div>
          <div className="flex gap-3 justify-center mt-2">
            <button
              type="button"
              onClick={connectGmail}
              className="btn btn-primary"
            >
              <MailIcon />
              <span>Conectar cuenta de Gmail</span>
            </button>
          </div>
        </section>
      ) : (
        <section className="mailbox">
          {localFiles.length > 0 && (
            <p className="px-4 pt-3 text-sm muted" role="status">
              Hay archivos locales cargados. Quítalos para poder seleccionar
              adjuntos de Gmail.
            </p>
          )}
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
            <label className="mail-limit">
              <span className="sr-only">Cantidad de correos</span>
              <select
                className="input"
                value={mailLimit}
                onChange={(e) => setMailLimit(Number(e.target.value))}
                aria-label="Cantidad de correos"
              >
                <option value={10}>10 correos</option>
                <option value={20}>20 correos</option>
                <option value={30}>30 correos</option>
              </select>
            </label>
            <button
              type="button"
              onClick={fetchGmailMessages}
              disabled={isLoadingMails}
              className="btn btn-ghost btn-sm"
            >
              {isLoadingMails ? "Actualizando..." : "Actualizar bandeja"}
            </button>
            {(!hasLoadedGmail || isLoadingMails) && (
              <button
                type="button"
                onClick={fetchGmailMessages}
                disabled={isLoadingMails}
                className="btn btn-primary btn-sm"
              >
                {isLoadingMails ? "Cargando..." : "Cargar correos"}
              </button>
            )}
            <div className="seg">
              <button
                type="button"
                aria-pressed={!onlyMessagesWithAttachments}
                onClick={() => setOnlyMessagesWithAttachments(false)}
              >
                Todos
              </button>
              <button
                type="button"
                aria-pressed={onlyMessagesWithAttachments}
                onClick={() => setOnlyMessagesWithAttachments(true)}
              >
                Con adjuntos
              </button>
            </div>
            <span className="muted text-xs ml-auto">
              {visibleMessages.length} conversación
              {visibleMessages.length !== 1 ? "es" : ""}
            </span>
          </div>

          {!hasLoadedGmail || isLoadingMails ? (
            <GmailSkeleton />
          ) : (
            <div className="mail-panes">
              <div className="mail-list">
                {filteredMessages.length === 0 ? (
                  <div className="empty">
                    <b>Sin resultados</b>
                    <p>Prueba con otro término de búsqueda.</p>
                  </div>
                ) : (
                  visibleMessages.map((msg) => {
                    const isSelected = selectedMailId === msg.id;
                    const count = msg.archivosAdjuntos.length;
                    return (
                      <article
                        key={msg.id}
                        className={`thread ${isSelected ? "is-open" : ""}`}
                        style={{
                          cursor:
                            localFiles.length > 0 || isAuthenticating
                              ? "not-allowed"
                              : "pointer",
                          opacity:
                            localFiles.length > 0 || isAuthenticating
                              ? 0.6
                              : undefined,
                        }}
                        onClick={() => {
                          if (localFiles.length > 0 || isAuthenticating) return;
                          setSelectedMailId(msg.id);
                          setSelectedAttachmentIndexes((prev) =>
                            prev[msg.id]
                              ? prev
                              : {
                                  ...prev,
                                  [msg.id]: msg.archivosAdjuntos
                                    .slice(0, 15)
                                    .map((_, i) => i),
                                },
                          );
                          resetExtractedData();
                        }}
                      >
                        <span
                          className="thread-av"
                          style={{
                            background: isSelected
                              ? "var(--primary)"
                              : "var(--ink-2)",
                          }}
                        >
                          {msg.from.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="thread-main">
                          <div className="thread-top">
                            <b>{msg.from.split("<")[0].trim() || msg.from}</b>
                            {count > 0 && (
                              <span className="thread-count">[{count}]</span>
                            )}
                            <span className="thread-time">
                              {new Date(msg.date).toLocaleDateString("es-GT", {
                                month: "numeric",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <span className="thread-subject">{msg.subject}</span>
                          <span className="thread-snippet">
                            {msg.cuerpo
                              ? msg.cuerpo.slice(0, 80) + "…"
                              : "Sin contenido de texto"}
                          </span>
                          {count > 0 && (
                            <div className="thread-meta">
                              <span className="clip">
                                <ClipIcon />
                                <span>
                                  {count} archivo{count !== 1 ? "s" : ""}
                                </span>
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
                        <span className="tag tag-neutral">
                          De: {selectedMail.from}
                        </span>
                        <span className="tag tag-neutral">
                          Fecha:{" "}
                          {new Date(selectedMail.date).toLocaleString("es-GT")}
                        </span>
                        {selectedMail.archivosAdjuntos.length > 0 && (
                          <span className="tag tag-info">
                            {selectedCount} de{" "}
                            {selectedMail.archivosAdjuntos.length} adjuntos
                            elegidos
                          </span>
                        )}
                      </div>
                    </header>

                    <div className="msg-list">
                      <article className="msg">
                        <header className="msg-head">
                          <span
                            className="msg-av"
                            style={{ background: "var(--primary)" }}
                          >
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
                          {selectedMail.cuerpo ||
                            "Este correo no contiene texto plano."}
                        </div>

                        {selectedMail.archivosAdjuntos.length > 0 && (
                          <div className="msg-files">
                            {selectedMail.archivosAdjuntos.map(
                              (nombre, index) => {
                                const isChecked =
                                  selectedAttachmentIndexes[
                                    selectedMail.id
                                  ]?.includes(index) ?? false;
                                const ext =
                                  nombre.split(".").pop()?.toLowerCase() || "";
                                const isPdf = ext === "pdf";
                                const isXls = ext === "xls" || ext === "xlsx";
                                return (
                                  <label
                                    key={`${nombre}-${index}`}
                                    className="filechip"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      disabled={
                                        localFiles.length > 0 ||
                                        isAuthenticating
                                      }
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        const current =
                                          selectedAttachmentIndexes[
                                            selectedMail.id
                                          ] || [];
                                        if (checked && current.length >= 15) {
                                          pushLog(
                                            "Puedes seleccionar hasta 15 archivos por trámite.",
                                            "error",
                                          );
                                          return;
                                        }
                                        resetExtractedData();
                                        setSelectedAttachmentIndexes((prev) => {
                                          return {
                                            ...prev,
                                            [selectedMail.id]: checked
                                              ? [...current, index]
                                              : current.filter(
                                                  (i) => i !== index,
                                                ),
                                          };
                                        });
                                      }}
                                      style={{
                                        accentColor: "var(--primary)",
                                        width: 16,
                                        height: 16,
                                      }}
                                    />
                                    <span
                                      className={`ftype ${isPdf ? "ft-pdf" : isXls ? "ft-xls" : "ft-doc"}`}
                                    >
                                      {ext.slice(0, 3).toUpperCase()}
                                    </span>
                                    <span style={{ minWidth: 0 }}>
                                      <span
                                        className="fname"
                                        style={{ display: "block" }}
                                      >
                                        {nombre}
                                      </span>
                                      <span className="fsize">
                                        Adjunto de embarque
                                      </span>
                                    </span>
                                  </label>
                                );
                              },
                            )}
                          </div>
                        )}
                      </article>
                    </div>
                  </>
                ) : (
                  <div className="empty">
                    <MailIcon />
                    <b>Ningún correo seleccionado</b>
                    <p>
                      Selecciona un correo de la lista izquierda para revisar
                      sus adjuntos.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* TARJETA EXTRAER DATOS */}
      <section className="card mt-5">
        <div className="card-head">
          <div>
            <h2>Extraer los datos</h2>
            <p className="muted text-sm mt-0.5">
              La IA lee los archivos marcados y arma la DUCA-T. También puedes
              subir un archivo desde tu computadora.
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
            <div className="field">
              <span>Archivos elegidos del correo</span>
              <input
                className="input"
                readOnly
                title={selectedAttachmentNames.join(", ")}
                value={
                  selectedAttachmentNames.length > 0
                    ? selectedAttachmentNames.join(", ")
                    : "Todavía no has marcado archivos"
                }
              />
              {selectedMailId && (
                <button
                  type="button"
                  className="btn btn-quiet btn-sm mt-2"
                  onClick={clearEmailSelection}
                  disabled={isAuthenticating}
                >
                  Quitar selección del correo
                </button>
              )}
            </div>

            <div className="field">
              <span>O sube archivos (PDF, XLS o XLSX; máximo 15)</span>
              <input
                className="input"
                readOnly
                title={localFiles.map((file) => file.name).join(", ")}
                value={
                  localFiles.length > 0
                    ? localFiles.map((file) => file.name).join(", ")
                    : "Todavía no has cargado archivos locales"
                }
              />
              <input
                ref={localFilesInputRef}
                className="sr-only"
                type="file"
                multiple
                accept="application/pdf,.pdf,.xls,.xlsx"
                onChange={handleFileChange}
                aria-label="Seleccionar archivos locales"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => localFilesInputRef.current?.click()}
                  disabled={
                    Boolean(selectedMailId) ||
                    isAuthenticating ||
                    localFiles.length >= 15
                  }
                >
                  Agregar archivos
                  {localFiles.length > 0 ? ` (${localFiles.length}/15)` : ""}
                </button>
                {localFiles.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-quiet btn-sm"
                    onClick={clearLocalFiles}
                    disabled={isAuthenticating}
                  >
                    Quitar todos
                  </button>
                )}
              </div>
              {localFiles.length > 0 && (
                <ul
                  className="mt-2 space-y-1"
                  aria-label="Archivos locales cargados"
                >
                  {localFiles.map((file, index) => (
                    <li
                      key={`${file.name}-${file.lastModified}-${index}`}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="min-w-0 truncate" title={file.name}>
                        {file.name}
                      </span>
                      <button
                        type="button"
                        className="btn btn-quiet btn-sm"
                        onClick={() => removeLocalFile(index)}
                        disabled={isAuthenticating}
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

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
                    <p className="text-xs sm:text-sm mt-0.5">
                      {discrepancyDetails}
                    </p>
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

              {missingFields.length > 0 && (
                <div className="alert alert-warn">
                  <WarnIcon />
                  <div>
                    <b>Completa los campos requeridos antes de enviar.</b>
                    <p className="text-xs sm:text-sm mt-0.5">
                      {missingFields.join(", ")}. Complétalos en Revisar DUCA T.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (showPreview) requestClosePreview();
                    else {
                      setPreviewDraft(null);
                      setHasPreviewDraftChanges(false);
                      setShowPreview(true);
                    }
                  }}
                  className="btn btn-primary"
                >
                  <DocIcon />
                  <span>
                    {showPreview ? "Ocultar DUCA T" : "Revisar DUCA T"}
                  </span>
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
                  disabled={isAuthenticating || !parsedData}
                  className="btn btn-go ml-auto"
                >
                  <ShieldIcon />
                  <span>
                    {isAuthenticating
                      ? "Autenticando..."
                      : "Autenticar en SIECA y enviar"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => void cancelCurrentFlow()}
                  disabled={
                    isAutomationActionBusy ||
                    isExtracting ||
                    (isAuthenticating && !automationId)
                  }
                  className="btn btn-ghost"
                >
                  Cancelar trámite
                </button>
              </div>

              {automationId && automationState && (
                <div className="card mt-4">
                  <div className="card-body space-y-2">
                    <div>
                      <b>Estado:</b>{" "}
                      {automationStatusLabel(automationState.status)}
                    </div>
                    {automationState.step && (
                      <div>
                        <b>Paso actual:</b> {automationState.step}
                      </div>
                    )}
                    {automationState.pauseReason && (
                      <div>
                        <b>Motivo de pausa:</b> {automationState.pauseReason}
                      </div>
                    )}
                    {automationState.status.toLowerCase() ===
                      "revision_final" && (
                      <label className="field mt-3" style={{ maxWidth: 360 }}>
                        <span>Número de DUCA</span>
                        <input
                          className="input"
                          placeholder="Esperando número de DUCA"
                          value={ducaNumber}
                          readOnly
                          aria-readonly="true"
                        />
                        <small className="muted">
                          Se guardará junto con el BL, contenedor, fecha y
                          estado.
                        </small>
                      </label>
                    )}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {["pausado", "paused", "revision_final"].includes(
                        automationState.status.toLowerCase(),
                      ) && (
                        <button
                          type="button"
                          onClick={() => void runAutomationAction("resume")}
                          disabled={isAutomationActionBusy}
                          className="btn btn-primary"
                        >
                          {automationState.status.toLowerCase() ===
                          "revision_final"
                            ? "Ya guardé la DUCA, finalizar"
                            : "Continuar"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
                <p>
                  Datos individuales procesados por la IA para este embarque.
                </p>
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
                    <ArchivoTexto
                      nombreArchivo={archivo.nombreArchivo}
                      datos={archivo.datos}
                    />
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
        <div className="modal" onClick={requestClosePreview}>
          <div
            className="modal-box lg"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="duca-preview-title"
          >
            <header className="modal-head">
              <div className="flex-1">
                <h2 id="duca-preview-title">
                  Revisión de la Declaración DUCA-T
                </h2>
                <p>Valida y corrige los 9 pasos antes de enviarla a SIECA.</p>
              </div>
              <button
                type="button"
                onClick={requestClosePreview}
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
                onDraftChange={handleDraftChange}
                hasDiscrepancies={hasDiscrepancies}
                discrepancyDetails={discrepancyDetails}
              />
            </div>

            <footer className="modal-foot">
              <button
                type="button"
                onClick={requestClosePreview}
                className="btn btn-ghost"
              >
                Cerrar revisión
              </button>
            </footer>
          </div>
        </div>
      )}

      {showUnsavedDialog && (
        <div className="modal" onClick={() => setShowUnsavedDialog(false)}>
          <div
            className="modal-box sm"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="unsaved-title"
          >
            <header className="modal-head">
              <div className="flex-1">
                <h2 id="unsaved-title">Hay cambios sin guardar</h2>
                <p>¿Qué quieres hacer con los cambios de la revisión?</p>
              </div>
            </header>
            <div className="modal-foot">
              <button
                type="button"
                onClick={saveDraftAndClose}
                className="btn btn-primary"
              >
                Guardar y cerrar
              </button>
              <button
                type="button"
                onClick={discardDraftAndClose}
                className="btn btn-ghost"
              >
                Salir sin guardar
              </button>
              <button
                type="button"
                onClick={() => setShowUnsavedDialog(false)}
                className="btn btn-quiet"
              >
                Seguir editando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONSOLA FLOTANTE */}
      <ActivityConsole logs={auditLog} />
    </main>
  );
}
