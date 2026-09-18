export type AuditEntry = {
  id: string;
  level: "info" | "success" | "error";
  message: string;
  time: string;
};

export const initialAuditEntry: AuditEntry = {
  id: "initial",
  level: "info",
  message: "Sistema listo. Inicie con la autenticacion SIECA.",
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
