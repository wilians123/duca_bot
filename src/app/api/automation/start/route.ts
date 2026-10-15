import { NextRequest } from "next/server";
import { descargarAdjuntosSeleccionados, GmailAdjuntosError } from "@/lib/gmail-adjuntos";
import { automationUrl, relayResponse, unavailableResponse } from "../proxy";
import { authenticateFirebaseRequest } from "@/lib/gmail-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const incoming = await request.formData();
    const datos = incoming.get("datos");
    if (typeof datos !== "string") {
      return Response.json({ ok: false, error: { codigo: "REQUEST_INVALID_ERR", mensaje: "Debe enviar datos como JSON." } }, { status: 400 });
    }
    try {
      JSON.parse(datos);
    } catch {
      return Response.json({ ok: false, error: { codigo: "REQUEST_INVALID_ERR", mensaje: "El campo datos debe ser JSON válido." } }, { status: 400 });
    }

    const outgoing = new FormData();
    outgoing.append("datos", datos);
    const mailId = incoming.get("mailId");
    const uploadedFiles = incoming.getAll("files");
    const legacyFile = incoming.get("file");
    const localFiles = uploadedFiles.length > 0
      ? uploadedFiles
      : legacyFile === null ? [] : [legacyFile];
    if (typeof mailId === "string" && mailId && localFiles.length > 0) {
      return Response.json({ ok: false, error: { codigo: "REQUEST_INVALID_ERR", mensaje: "Usa archivos locales o adjuntos de Gmail, no ambos." } }, { status: 400 });
    }
    if (typeof mailId === "string" && mailId) {
      const auth = await authenticateFirebaseRequest(request);
      if (!auth.identity) {
        return Response.json({ ok: false, error: { codigo: "AUTH_REQUIRED", mensaje: auth.error?.message } }, { status: auth.error?.status || 401 });
      }
      let selected: number[] = [];
      const rawIndexes = incoming.get("selectedAttachmentIndexes");
      try {
        const parsed: unknown = JSON.parse(typeof rawIndexes === "string" ? rawIndexes : "[]");
        if (!Array.isArray(parsed) || parsed.length > 15 || !parsed.every((index) => Number.isInteger(index) && index >= 0)) {
          return Response.json({ ok: false, error: { codigo: "REQUEST_INVALID_ERR", mensaje: "Selecciona hasta 15 adjuntos válidos." } }, { status: 400 });
        }
        selected = parsed as number[];
      } catch {
        return Response.json({ ok: false, error: { codigo: "REQUEST_INVALID_ERR", mensaje: "Los índices de adjuntos no son válidos." } }, { status: 400 });
      }
      const archivos = await descargarAdjuntosSeleccionados(auth.identity.uid, mailId, selected);
      for (const archivo of archivos) {
        outgoing.append("archivos", new Blob([new Uint8Array(archivo.datos)], { type: archivo.tipoMime }), archivo.nombre);
      }
    } else {
      if (localFiles.length === 0) {
        return Response.json({ ok: false, error: { codigo: "REQUEST_INVALID_ERR", mensaje: "Envía entre 1 y 15 archivos locales o selecciona adjuntos de Gmail." } }, { status: 400 });
      }
      if (localFiles.length > 15 || !localFiles.every((entry) => entry instanceof File)) {
        return Response.json({ ok: false, error: { codigo: "FILE_LIMIT_ERR", mensaje: "Se permiten hasta 15 archivos PDF, XLS o XLSX por lote." } }, { status: 400 });
      }
      for (const entry of localFiles) {
        const file = entry as File;
        if (!/\.(pdf|xls|xlsx)$/i.test(file.name)) {
          return Response.json({ ok: false, error: { codigo: "ARCHIVO_NO_PERMITIDO_ERR", mensaje: "Solo se permiten archivos PDF, XLS o XLSX." } }, { status: 400 });
        }
        outgoing.append("archivos", file, file.name);
      }
    }

    const response = await fetch(automationUrl("/automation/start"), { method: "POST", body: outgoing });
    return await relayResponse(response);
  } catch (error) {
    if (error instanceof GmailAdjuntosError) {
      return Response.json({ ok: false, error: { codigo: error.codigo, mensaje: error.message } }, { status: error.status });
    }
    return unavailableResponse();
  }
}
