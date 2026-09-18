import type { Content, GenerateContentParameters, Part } from "@google/genai";

export type JsonRecord = Record<string, unknown>;

type GenerateContentResponseLike = {
  text?: string;
};

type GenerateContent = (
  request: GenerateContentParameters,
) => Promise<GenerateContentResponseLike>;

export const fallbackGeminiModels = [
  "gemini-flash-lite-latest",
  "gemini-flash-latest",
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.6-flash",
  "gemini-pro-latest",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

export const openRouterFreeModels = [
  "openrouter/free",
  "openai/gpt-oss-20b:free",
  "meta-llama/llama-3.3-8b-instruct:free",
  "qwen/qwen3-235b-a22b:free",
];

export const extractionPrompt = `
Extrae los datos de todos los documentos adjuntos (PDFs, Excels parseados a CSV, etc.) y del cuerpo del correo para crear una DUCA-T en SIECA.
Cruza la información de todos los archivos proporcionados para consolidar un único JSON dividido en 9 pasos (paso1 a paso9) y la bandera de validación.
Devuelve EXCLUSIVAMENTE JSON válido.

Reglas globales y Filtro Post-Lectura:
0. LECTURA EXHAUSTIVA: Analiza el 100% de la información de todos los archivos. El MBL y Manifiesto de Naviera suelen venir unidos, extrae toda su info. Compara TODO con el cuerpo del correo. Extrae SOLO lo necesario para el JSON.
   - CUERPO CORREO: Busca siempre "MANIFIESTO ELECTRONICO" para el numero de manifiesto, y "MARCHAMO SAT" para el marchamo.
   - MBL/MANIFIESTO: Busca "PORT OF DISCHARGE FROM VESSEL", esto SIEMPRE es la Aduana de salida.
   - VALIDACION: Compara la info del correo con la info de los adjuntos. Si hay discrepancias, "hasDiscrepancies": true y detalla en "discrepancyDetails". Si no, false.

1. PASO 1:
   - paisProcedencia: SIEMPRE "GUATEMALA".
   - aduanaInicio: Del "PORT OF DISCHARGE FROM VESSEL" o "POD" en MBL.
   - paisDestino: Determinar según el trámite sea a El Salvador o Guatemala.
   - aduanaDestino: Buscar en el .xls, o si hay un PDF llamado "carta de aceptacion" extraer de ahí la aduana y su numero.
   - observaciones: Llenar solo con campos validos, omitir vacíos.
   - numeroDeclaracion: Se encuentra UNICAMENTE en el archivo con titulo "DECLARACION UNICA CENTROAMERICANA (DUCA)" en campo "2 No de DUCA". Si no existe este documento, no se agrega a observaciones.
   - Si no hay valor detallado de transporte o seguro, al final de observaciones agregar: "SE DECLARA $ 1.00 EN CASILLA 26 Y 27 PARA EFECTOS DE ADUANA".

2. PASO 2 (Exportador) y PASO 3 (Importador):
   - Extraer: Nombre, Dirección, NIT, País.
   - Priorizar HBL si existe, si no, del MBL.
   - tipoDocumento: SIEMPRE "NUMERO DE REGISTRO UNICO DE CONTRIBUYENTE".
   - paisEmision: El que indique el MBL o HBL.
   - Paso 2: Numero de documento de identificacion NO es obligatorio.
   - Paso 3: SÍ es obligatorio. (Si falta, deja nit en null o emite string vacio, la app avisara).

3. PASO 4:
   - aduanaPaso: Para El Salvador, SIEMPRE "LA ERMITA". Para Puerto Barrios, dejar null o vacío (el usuario lo ingresa).

4. PASO 7 (Totales):
   - Extraer VALOR DE TRANSACCION, GASTOS DE TRANSPORTE, GASTOS DE SEGURO y OTROS GASTOS del .xls o la DUCA.
   - Si no se detallan transporte/seguro, se debe poner 1.00 en cada campo.

5. PASO 8 (Adjuntos):
   - Agrupar por títulos idénticos al portal SIECA. (cartaporte, facturas, manifiestos, etc.)
   - Cada archivo debe tener: nombreArchivo, tipoDocumento, numeroDocumento.
   - Estructura: DOCUMENTO: [Nombre exacto], TIPO DE DOCUMENTO: [Ej. FACTURA COMERCIAL], NO. DE DOCUMENTO: [numero].
   - No mezclar archivos de carpetas distintas.

6. PASO 9 (Equipamiento):
   - equipamiento: "CONTENEDOR".
   - tipoCarga: "CONTENERIZADA".
   - remolque.chasis: Extraer de tarjetas de circulacion, DPI, licencia o cuerpo correo.
   - marchamo: Agregar prefijo "SAT-GT " al número extraído del correo o archivo MARCHAMOS.
   - contenedor.numero: Extraer del MBL, .xls o correo.
   - remolque.nacionalidad: Si chasis inicia TC = "GUATEMALA", si RE = "EL SALVADOR".
   - contenedor.tipo y contenedor.tamano (del MBL): Si dice 40 -> tipo="CONTENEDOR HIGH-CUBE CODIGO: 45GP", tamano="45G1". Si 20 -> tipo="CONTENEDOR DE PROPOSITO GENERAL CODIGO: 20GP", tamano="20G1". Si 45 -> tipo=null, tamano="45HC".

Usa esta estructura JSON exacta:
{
  "hasDiscrepancies": false,
  "discrepancyDetails": null,
  "paso1": {
    "aduanaSalida": null,
    "aduanaEntrada": null,
    "paisInicio": "GUATEMALA",
    "paisDestino": null,
    "observaciones": null,
    "numeroDeclaracion": null
  },
  "paso2": {
    "nombre": null,
    "nit": null,
    "pais": null,
    "tipoDocumento": "NUMERO DE REGISTRO UNICO DE CONTRIBUYENTE"
  },
  "paso3": {
    "nombre": null,
    "nit": null,
    "pais": null,
    "tipoDocumento": "NUMERO DE REGISTRO UNICO DE CONTRIBUYENTE"
  },
  "paso4": {
    "aduanaPaso": null
  },
  "paso5": {
    "transportista": { "nombre": null, "codigo": null, "nit": null },
    "vehiculo": { "placa": null, "nacionalidad": null }
  },
  "paso6": {
    "nombre": null,
    "documento": null,
    "tipoDocumento": null,
    "licencia": null,
    "nacionalidad": null
  },
  "paso7": {
    "gastos": {
      "transporte": null,
      "seguro": null,
      "otros": null
    },
    "mercancias": [
      {
        "descripcion": null,
        "numeroMercancia": null,
        "cantidad": 0,
        "bultos": 0,
        "claseBultos": "PK-paquete",
        "pesoBruto": 0,
        "pesoNeto": 0,
        "valor": 0,
        "paisOrigen": null
      }
    ]
  },
  "paso8": {
    "cartaporte": [],
    "facturas": [],
    "manifiestos": [],
    "MBL": [],
    "HBL": []
  },
  "paso9": {
    "remolque": {
      "chasis": null,
      "placa": null,
      "nacionalidad": null
    },
    "contenedor": {
      "numero": null,
      "tipo": null,
      "tamano": null
    },
    "marchamo": null,
    "equipamiento": "CONTENEDOR",
    "tipoCarga": "CONTENERIZADA"
  }
}
`;

export const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const normalizeModelName = (model: string) =>
  model.trim().replace(/^models\//, "");

export const resolveGeminiModelCandidates = (
  preferredModel?: string | null,
) => {
  const candidates = [
    preferredModel ? normalizeModelName(preferredModel) : null,
    ...fallbackGeminiModels,
  ].filter((model): model is string => Boolean(model));

  return [...new Set(candidates)];
};

export const isRecoverableModelError = (error: unknown) => {
  const status =
    isRecord(error) && typeof error.status === "string" ? error.status : "";
  const message =
    error instanceof Error ? error.message : JSON.stringify(error);

  return /NOT_FOUND|RESOURCE_EXHAUSTED|quota|unavailable|overloaded|not found|404|429|500|502|503|504|not supported for generateContent/i.test(
    `${status} ${message}`,
  );
};

const extractTextForOpenRouter = (request: Omit<GenerateContentParameters, "model">) => {
  const contents = Array.isArray(request.contents) ? request.contents : [request.contents];
  return contents.flatMap((content): string[] => {
    if (typeof content !== "object" || content === null || !("parts" in content)) {
      return [];
    }
    const typedContent = content as Content;
    return (typedContent.parts || []).map((part) => {
      if (typeof part.text === "string") return part.text;
      if (part.inlineData) return "[Contenido binario adjunto; procesar con OCR/PDF del microservicio.]";
      return "";
    });
  }).filter(Boolean).join("\n\n");
};

const generateWithOpenRouter = async (
  request: Omit<GenerateContentParameters, "model">,
  apiKey: string,
) => {
  let ultimoError: unknown;
  for (const model of openRouterFreeModels) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "DUCA-T Extraction Service",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: extractTextForOpenRouter(request) }],
          temperature: 0,
          response_format: { type: "json_object" },
        }),
      });
      if (!response.ok) throw new Error(`OpenRouter ${response.status}: ${await response.text()}`);
      const payload = await response.json() as { choices?: { message?: { content?: string } }[] };
      return { response: { text: payload.choices?.[0]?.message?.content ?? "" }, model: `openrouter/${model}` };
    } catch (error) {
      ultimoError = error;
      if (!isRecoverableModelError(error)) throw error;
    }
  }
  throw ultimoError instanceof Error ? ultimoError : new Error("OpenRouter no tiene modelos disponibles.");
};

export const generateContentWithModelFallback = async (
  generateContent: GenerateContent,
  request: Omit<GenerateContentParameters, "model">,
  modelCandidates: string[],
) => {
  let lastError: unknown;

  for (const model of modelCandidates) {
    try {
      const response = await generateContent({ ...request, model });

      return { response, model };
    } catch (error) {
      lastError = error;

      if (!isRecoverableModelError(error)) {
        throw error;
      }
    }
  }
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  if (openRouterApiKey) {
    try {
      return await generateWithOpenRouter(request, openRouterApiKey);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("No hay modelos Gemini ni OpenRouter disponibles para generateContent.");
};

const asCleanString = (value: unknown) =>
  typeof value === "string" ? value.trim() : value;

const parseMaybeNumber = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/\s/g, "").replace(",", ".");
    const parsed = Number(normalized);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
};

export const parseJsonFromModel = (text: string) => {
  const withoutFences = text
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .trim();
  const firstBrace = withoutFences.indexOf("{");
  const lastBrace = withoutFences.lastIndexOf("}");
  const jsonText =
    firstBrace >= 0 && lastBrace > firstBrace
      ? withoutFences.slice(firstBrace, lastBrace + 1)
      : withoutFences;

  return JSON.parse(jsonText) as JsonRecord;
};

const recursivelyTrimStrings = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(recursivelyTrimStrings);
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        recursivelyTrimStrings(entry),
      ]),
    );
  }

  return asCleanString(value);
};

export const cleanDucaData = (rawData: JsonRecord) => {
  const data = recursivelyTrimStrings(rawData) as JsonRecord;
  
  const paso5 = isRecord(data.paso5) ? data.paso5 : {};
  const transportista = isRecord(paso5.transportista) ? paso5.transportista : {};
  transportista.codigo = typeof transportista.codigo === "string" ? transportista.codigo.replace(/sv:/i, "").trim() : transportista.codigo;
  paso5.transportista = transportista;
  data.paso5 = paso5;

  const paso6 = isRecord(data.paso6) ? data.paso6 : {};
  paso6.documento = typeof paso6.documento === "string" ? paso6.documento.replace(/[-\s]/g, "") : paso6.documento;
  paso6.licencia = typeof paso6.licencia === "string" ? paso6.licencia.replace(/[-\s]/g, "") : paso6.licencia;
  data.paso6 = paso6;

  const paso9 = isRecord(data.paso9) ? data.paso9 : {};
  const marchamo = typeof paso9.marchamo === "string" ? paso9.marchamo.replace(/^SAT-GT\s*/i, "").trim() : "";
  paso9.marchamo = marchamo ? `SAT-GT ${marchamo}` : "SAT-GT ";
  
  const remolque = isRecord(paso9.remolque) ? paso9.remolque : {};
  const remolqueId = typeof remolque.chasis === "string" && remolque.chasis ? remolque.chasis.trim().toUpperCase() : typeof remolque.placa === "string" ? remolque.placa.trim().toUpperCase() : "";
  if (remolqueId.startsWith("RE")) remolque.nacionalidad = "El Salvador";
  if (remolqueId.startsWith("TC")) remolque.nacionalidad = "Guatemala";
  paso9.remolque = remolque;
  data.paso9 = paso9;

  const paso7 = isRecord(data.paso7) ? data.paso7 : {};
  const gastos = isRecord(paso7.gastos) ? paso7.gastos : {};
  gastos.transporte = gastos.transporte === null || gastos.transporte === "" ? 1 : parseMaybeNumber(gastos.transporte, 1);
  gastos.seguro = gastos.seguro === null || gastos.seguro === "" ? 1 : parseMaybeNumber(gastos.seguro, 1);
  gastos.otros = gastos.otros === null || gastos.otros === "" ? 0 : parseMaybeNumber(gastos.otros, 0);
  paso7.gastos = gastos;

  const mercancias = Array.isArray(paso7.mercancias) ? paso7.mercancias : [];
  paso7.mercancias = mercancias.map((item) => {
    if (!isRecord(item)) return item;
    return {
      ...item,
      numeroMercancia: typeof item.numeroMercancia === "string" ? item.numeroMercancia.replace(/[.\s]/g, "") : item.numeroMercancia,
      cantidad: parseMaybeNumber(item.cantidad, 0),
      bultos: parseMaybeNumber(item.bultos, 0),
      pesoBruto: parseMaybeNumber(item.pesoBruto, 0),
      pesoNeto: parseMaybeNumber(item.pesoNeto, 0),
      valor: parseMaybeNumber(item.valor, 0),
    };
  });
  data.paso7 = paso7;

  return data;
};

export const buildGeminiPdfRequest = (
  fileBuffers: { mimeType: string; data: Buffer }[],
  emailBodyText: string,
): Omit<GenerateContentParameters, "model"> => {
  const parts: Part[] = [
    { text: extractionPrompt },
    { text: "CUERPO DEL CORREO:\\n" + emailBodyText }
  ];

  for (const fb of fileBuffers) {
    if (fb.mimeType.includes("text/csv") || fb.mimeType.includes("text/plain")) {
      parts.push({ text: "\\n--- INICIO CONTENIDO EXCEL/TEXTO ---\\n" + fb.data.toString("utf8") + "\\n--- FIN CONTENIDO EXCEL/TEXTO ---\\n" });
    } else {
      parts.push({
        inlineData: {
          mimeType: fb.mimeType,
          data: fb.data.toString("base64"),
        },
      });
    }
  }

  return {
    contents: [{ role: "user", parts }],
    config: {
      responseMimeType: "application/json",
      temperature: 0,
    },
  };
};
