import path from "node:path";
import { getGmailConnection } from "@/lib/gmail-user";

type GmailPart = {
  filename?: string | null;
  mimeType?: string | null;
  body?: { attachmentId?: string | null } | null;
  parts?: GmailPart[] | null;
};

export type GmailAdjunto = { nombre: string; tipoMime: string; datos: Buffer };

export class GmailAdjuntosError extends Error {
  constructor(public codigo: string, message: string, public status: number) {
    super(message);
  }
}

export async function descargarAdjuntosSeleccionados(
  uid: string,
  mailId: string,
  indices: number[],
): Promise<GmailAdjunto[]> {
  const connection = getGmailConnection(uid);
  if (!connection) {
    throw new GmailAdjuntosError("GMAIL_AUTH_ERR", "Gmail no está vinculado. Autentícate primero.", 401);
  }

  try {
    const { google } = await import("googleapis");
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI,
    );
    oauth2Client.setCredentials(connection.tokens);
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const message = await gmail.users.messages.get({ userId: "me", id: mailId });
    const payload = message.data.payload;
    if (!payload) throw new GmailAdjuntosError("GMAIL_MESSAGE_ERR", "No se pudo leer el contenido del correo.", 502);

    function listar(part: GmailPart): GmailPart[] {
      const propios = part.filename && part.body?.attachmentId ? [part] : [];
      return propios.concat((part.parts || []).flatMap(listar));
    }

    const parts = listar(payload as GmailPart);
    const archivos: GmailAdjunto[] = [];
    for (const [indice, part] of parts.entries()) {
      if (!indices.includes(indice)) continue;
      const nombre = String(part.filename || "");
      const extension = path.extname(nombre).toLowerCase();
      if (![".pdf", ".xls", ".xlsx"].includes(extension)) continue;
      const attachmentId = part.body?.attachmentId;
      if (!attachmentId) continue;

      const response = await gmail.users.messages.attachments.get({
        userId: "me",
        messageId: mailId,
        id: attachmentId,
      });
      if (!response.data.data) continue;
      archivos.push({
        nombre,
        tipoMime: extension === ".pdf" ? "application/pdf" : part.mimeType || "application/octet-stream",
        datos: Buffer.from(response.data.data, "base64"),
      });
    }

    if (archivos.length === 0) {
      throw new GmailAdjuntosError("ATTACHMENTS_EMPTY_ERR", "El correo no tiene adjuntos PDF/XLS/XLSX válidos.", 400);
    }
    return archivos;
  } catch (error) {
    if (error instanceof GmailAdjuntosError) throw error;
    const e = error as { code?: number | string; message?: string; response?: { status?: number } };
    const code = Number(e.code ?? e.response?.status);
    const esAuth = code === 401 || /invalid_grant|invalid_client|unauthorized_client/i.test(e.message ?? "");
    if (esAuth) {
      throw new GmailAdjuntosError("GMAIL_AUTH_ERR", "La autorización de Gmail expiró. Vuelve a conectar Gmail.", 401);
    }
    throw error;
  }
}
