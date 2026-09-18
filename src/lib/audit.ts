export type AuditEntry = {
  id: number;
  level: "info" | "success" | "error";
  message: string;
  time: string;
};

export const initialAuditEntry: AuditEntry = {
  id: 1,
  level: "info",
  message: "Sistema listo. Inicie con la autenticacion SIECA.",
  time: "inicio",
};

export const createAuditEntry = (
  message: string,
  level: AuditEntry["level"] = "info",
  now = new Date(),
): AuditEntry => ({
  id: now.getTime(),
  level,
  message,
  time: now.toLocaleTimeString(),
});
