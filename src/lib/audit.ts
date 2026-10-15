export type AuditEntry = {
  id: string;
  level: "info" | "success" | "error";
  message: string;
  time: string;
};

export const initialAuditEntry: AuditEntry = {
  id: "initial",
  level: "info",
  message: "Sistema listo. Cargue los documentos para iniciar el trámite.",
  time: "inicio",
};

let auditSequence = 0;

export const createAuditEntry = (
  message: string,
  level: AuditEntry["level"] = "info",
  now = new Date(),
): AuditEntry => ({
  id: `${now.getTime()}-${auditSequence++}`,
  level,
  message,
  time: now.toLocaleTimeString(),
});
