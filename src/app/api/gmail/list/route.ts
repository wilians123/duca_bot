import { google } from "googleapis";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { guardarCorreo } from "@/lib/firebase-correo";

type GmailPart = {
  mimeType?: string | null;
  filename?: string | null;
  body?: { data?: string | null; attachmentId?: string | null } | null;
  parts?: GmailPart[] | null;
};

function decodificarBase64(data?: string | null) {
  return data ? Buffer.from(data, "base64").toString("utf-8") : "";
}

function extraerCuerpoTexto(parte: GmailPart): string {
  let texto = "";
  if (parte.mimeType === "text/plain" && parte.body?.data) {
    texto += `${decodificarBase64(parte.body.data)}\n`;
  }
  for (const hija of parte.parts || []) {
    texto += extraerCuerpoTexto(hija);
  }
  return texto;
}

function extraerNombresAdjuntos(parte: GmailPart): string[] {
  const nombres =
    parte.filename && parte.body?.attachmentId ? [String(parte.filename)] : [];
  return nombres.concat((parte.parts || []).flatMap(extraerNombresAdjuntos));
}

export async function GET() {
  try {
    const tokenPath = path.join(process.cwd(), "tmp", "gmail_tokens.json");
    if (!fs.existsSync(tokenPath)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            codigo: "GMAIL_AUTH_ERR",
            mensaje: "Gmail no está vinculado. Autentícate primero.",
          },
        },
        { status: 401 },
      );
    }

    const tokens = JSON.parse(fs.readFileSync(tokenPath, "utf-8"));
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI,
    );
    oauth2Client.setCredentials(tokens);

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 20,
      q: "has:attachment",
    });

    const messages = response.data.messages || [];
    const detailedMessages: {
      id: string;
      subject: string;
      from: string;
      date: string;
      cuerpo: string;
      archivosAdjuntos: string[];
    }[] = [];

    for (const msg of messages) {
      if (!msg.id) continue;
      const details = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full",
        metadataHeaders: ["Subject", "From", "Date"],
      });

      const headers = details.data.payload?.headers;
      const subject =
        headers?.find((h) => h.name === "Subject")?.value || "Sin Asunto";
      const from =
        headers?.find((h) => h.name === "From")?.value || "Desconocido";
      const date = headers?.find((h) => h.name === "Date")?.value || "";
      const payload = details.data.payload || {};
      const cuerpo = extraerCuerpoTexto(payload).trim();
      const archivosAdjuntos = extraerNombresAdjuntos(payload);
      detailedMessages.push({
        id: msg.id,
        subject,
        from,
        date,
        cuerpo,
        archivosAdjuntos,
      });

      try {
        await guardarCorreo({
          idCorreo: msg.id,
          asunto: subject,
          remitente: from,
          fecha: date,
          archivosAdjuntos,
          estado: "recibido",
        });
      } catch (firebaseError) {
        console.error(
          "No se pudo guardar el correo en Firebase:",
          firebaseError,
        );
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Correos obtenidos",
      data: detailedMessages,
    });
  } catch (error) {
    const status =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: number }).code === 401
        ? 401
        : 502;
    console.error("Error al consultar Gmail:", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          codigo: status === 401 ? "GMAIL_AUTH_ERR" : "GMAIL_UNAVAILABLE_ERR",
          mensaje:
            status === 401
              ? "La autorización de Gmail expiró. Vuelve a conectar Gmail."
              : "No se pudo consultar Gmail. Verifica la conexión de red y la autorización OAuth.",
        },
      },
      { status },
    );
  }
}
