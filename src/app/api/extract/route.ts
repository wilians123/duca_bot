import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 600;

const extractionTimeoutMs = Math.min(
  Math.max(
    Number(process.env.EXTRACTION_MICROSERVICE_TIMEOUT_MS || 640_000),
    30_000,
  ),
  690_000,
);

type DucaPayload = {
  hasDiscrepancies?: boolean;
  discrepancyDetails?: string | null;
  [key: string]: unknown;
};

type MicroservicePayload = {
  ok?: boolean;
  message?: string;
  datos?: DucaPayload;
  archivosJson?: unknown[];
  error?: unknown;
};

const microserviceUrl =
  process.env.EXTRACTION_MICROSERVICE_URL ||
  "http://127.0.0.1:8001/api/v1/extract";
const microserviceApiKey = process.env.EXTRACTION_MICROSERVICE_API_KEY;

type GmailPart = {
  filename?: string | null;
  mimeType?: string | null;
  body?: {
    size?: number | null;
    data?: string | null;
    attachmentId?: string | null;
  } | null;
  parts?: GmailPart[] | null;
};

function getEmailBody(payload: GmailPart): string {
  let body = "";
  if (payload.body && (payload.body.size ?? 0) > 0 && payload.body.data) {
    body = Buffer.from(payload.body.data, "base64").toString("utf-8");
  } else if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain") {
        if (part.body && part.body.data) {
          body +=
            Buffer.from(part.body.data, "base64").toString("utf-8") + "\n";
        }
      } else if (part.parts) {
        body += getEmailBody(part) + "\n";
      }
    }
  }
  return body.trim();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const mailId = formData.get("mailId") as string | null;
    const selectedAttachmentIndexesValue = formData.get(
      "selectedAttachmentIndexes",
    );
    let selectedAttachmentIndexes: Set<number> | null = null;
    if (typeof selectedAttachmentIndexesValue === "string") {
      try {
        const parsed = JSON.parse(selectedAttachmentIndexesValue);
        if (
          Array.isArray(parsed) &&
          parsed.every(
            (index) => Number.isInteger(index) && index >= 0,
          )
        ) {
          selectedAttachmentIndexes = new Set(parsed);
        }
      } catch {
        selectedAttachmentIndexes = null;
      }
    }

    const fileBuffers: { mimeType: string; data: Buffer }[] = [];
    const archivoNombres: string[] = [];
    let emailBodyText = "";

    if (mailId) {
      const { google } = await import("googleapis");
      const fs = await import("fs");
      const tokenPath = path.join(process.cwd(), "tmp", "gmail_tokens.json");
      if (!fs.existsSync(tokenPath)) {
        return NextResponse.json(
          {
            ok: false,
            message: "Gmail no está vinculado.",
            error: {
              codigo: "GMAIL_AUTH_ERR",
              mensaje: "Gmail no está vinculado.",
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

      const msg = await gmail.users.messages.get({ userId: "me", id: mailId });
      const payload = msg.data.payload;
      if (!payload) {
        return NextResponse.json(
          {
            ok: false,
            message: "Gmail devolvió un mensaje sin contenido.",
            error: {
              codigo: "GMAIL_MESSAGE_ERR",
              mensaje: "No se pudo leer el contenido del correo.",
            },
          },
          { status: 502 },
        );
      }

      emailBodyText = getEmailBody(payload);

      function getAttachmentParts(part: GmailPart): GmailPart[] {
        let atts: GmailPart[] = [];
        if (part.filename && part.body?.attachmentId) {
          atts.push(part);
        }
        if (part.parts) {
          for (const p of part.parts) {
            atts = atts.concat(getAttachmentParts(p));
          }
        }
        return atts;
      }

      const attachmentParts = getAttachmentParts(payload);

      for (const [attachmentIndex, part] of attachmentParts.entries()) {
        if (
          selectedAttachmentIndexes &&
          !selectedAttachmentIndexes.has(attachmentIndex)
        ) {
          continue;
        }
        const nombreArchivo = String(part.filename || "");
        const attachmentId = part.body?.attachmentId;
        if (!attachmentId) {
          continue;
        }
        const extension = path.extname(nombreArchivo).toLowerCase();
        if ([".doc", ".docx"].includes(extension)) {
          continue;
        }
        if (![".pdf", ".xls", ".xlsx"].includes(extension)) {
          continue;
        }
        const attachRes = await gmail.users.messages.attachments.get({
          userId: "me",
          messageId: mailId,
          id: attachmentId,
        });
        if (attachRes.data.data) {
          const buffer = Buffer.from(attachRes.data.data, "base64");
          let mimeType = part.mimeType || "application/pdf";
          if (part.filename?.toLowerCase().endsWith(".pdf"))
            mimeType = "application/pdf";
          fileBuffers.push({ mimeType, data: buffer });
          archivoNombres.push(nombreArchivo);
        }
      }

      if (fileBuffers.length === 0) {
        return NextResponse.json(
          {
            ok: false,
            message: "El correo no tiene adjuntos.",
            error: {
              codigo: "ATTACHMENTS_EMPTY_ERR",
              mensaje: "El correo no tiene adjuntos PDF/XLS/XLSX válidos.",
            },
          },
          { status: 400 },
        );
      }
    } else if (file instanceof File) {
      const extension = path.extname(file.name).toLowerCase();
      if ([".doc", ".docx"].includes(extension)) {
        return NextResponse.json(
          {
            ok: false,
            message: "Los documentos Word están prohibidos.",
            error: {
              codigo: "ARCHIVO_NO_PERMITIDO_ERR",
              mensaje: "Los documentos Word están prohibidos.",
            },
          },
          { status: 400 },
        );
      }
      if (![".pdf", ".xls", ".xlsx"].includes(extension)) {
        return NextResponse.json(
          {
            ok: false,
            message: "Tipo de archivo inválido.",
            error: {
              codigo: "ARCHIVO_NO_PERMITIDO_ERR",
              mensaje: "Solo se permiten PDF, XLS y XLSX.",
            },
          },
          { status: 400 },
        );
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      let mimeType = file.type;
      if (!mimeType && file.name.endsWith(".pdf")) mimeType = "application/pdf";

      fileBuffers.push({ mimeType, data: buffer });
      archivoNombres.push(file.name);
    } else {
      return NextResponse.json(
        {
          ok: false,
          message: "Debe enviar un archivo o mailId.",
          error: {
            codigo: "REQUEST_INVALID_ERR",
            mensaje: "Debe enviar un archivo o mailId.",
          },
        },
        { status: 400 },
      );
    }

    const microserviceForm = new FormData();
    for (const [indice, archivo] of fileBuffers.entries()) {
      microserviceForm.append(
        "archivos",
        new Blob([new Uint8Array(archivo.data)], { type: archivo.mimeType }),
        archivoNombres[indice],
      );
    }
    microserviceForm.append("cuerpo_correo", emailBodyText);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), extractionTimeoutMs);
    let microserviceResponse: Response;
    try {
      microserviceResponse = await fetch(microserviceUrl, {
        method: "POST",
        body: microserviceForm,
        headers: microserviceApiKey
          ? { "X-API-Key": microserviceApiKey }
          : undefined,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const responseText = await microserviceResponse.text();
    let microservicePayload: MicroservicePayload;
    try {
      microservicePayload = JSON.parse(responseText);
    } catch {
      microservicePayload = {
        ok: false,
        message: "El microservicio devolvió una respuesta no válida.",
        error: {
          codigo: "MICROSERVICE_INVALID_RESPONSE_ERR",
          mensaje: "La respuesta del microservicio no es JSON válido.",
          detalle: responseText.slice(0, 500),
        },
      };
    }
    if (!microserviceResponse.ok || !microservicePayload.ok) {
      return NextResponse.json(microservicePayload, {
        status: microserviceResponse.status || 502,
      });
    }

    const cleanData = microservicePayload.datos;
    if (!cleanData) {
      return NextResponse.json(
        {
          ok: false,
          message: "El microservicio no devolvió datos DUCA-T.",
          error: {
            codigo: "MICROSERVICE_INVALID_RESPONSE_ERR",
            mensaje: "Falta el objeto datos en la respuesta.",
          },
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "datos extraidos con el microservicio-extraccion",
      hasDiscrepancies: cleanData.hasDiscrepancies === true,
      discrepancyDetails: cleanData.discrepancyDetails,
      data: cleanData,
      archivosJson: microservicePayload.archivosJson || [],
    });
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error desconocido.";
    const agotado =
      error instanceof DOMException && error.name === "AbortError";
    const indisponible =
      /503|unavailable|overloaded|quota|resource_exhausted|429|timeout/i.test(
        mensaje,
      );
    return NextResponse.json(
      {
        ok: false,
        message: agotado
          ? "El microservicio tardó demasiado en responder."
          : "No se pudo extraer o limpiar la informacion.",
        error: {
          codigo: agotado
            ? "MICROSERVICE_TIMEOUT_ERR"
            : indisponible
              ? "AI_UNAVAILABLE_ERR"
              : "MICROSERVICE_CRASH_ERR",
          mensaje: agotado
            ? "La extracción superó el tiempo máximo configurado."
            : indisponible
              ? "Todos los modelos de IA están temporalmente indisponibles."
              : "Falló la extracción, OCR, Pandas o la validación del servicio.",
          detalle: mensaje,
        },
      },
      { status: agotado ? 504 : indisponible ? 503 : 502 },
    );
  }
}
