export type JsonRecord = Record<string, unknown>;

export const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

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
  const transportista = isRecord(paso5.transportista)
    ? paso5.transportista
    : {};
  transportista.codigo =
    typeof transportista.codigo === "string"
      ? transportista.codigo.replace(/sv:/i, "").trim()
      : transportista.codigo;
  paso5.transportista = transportista;
  data.paso5 = paso5;

  const paso6 = isRecord(data.paso6) ? data.paso6 : {};
  paso6.documento =
    typeof paso6.documento === "string"
      ? paso6.documento.replace(/[-\s]/g, "")
      : paso6.documento;
  paso6.licencia =
    typeof paso6.licencia === "string"
      ? paso6.licencia.replace(/[-\s]/g, "")
      : paso6.licencia;
  data.paso6 = paso6;

  const paso9 = isRecord(data.paso9) ? data.paso9 : {};
  const marchamo =
    typeof paso9.marchamo === "string"
      ? paso9.marchamo.replace(/^SAT-GT\s*/i, "").trim()
      : "";
  paso9.marchamo = marchamo ? `SAT-GT ${marchamo}` : "SAT-GT ";

  const remolque = isRecord(paso9.remolque) ? paso9.remolque : {};
  const remolqueId =
    typeof remolque.chasis === "string" && remolque.chasis
      ? remolque.chasis.trim().toUpperCase()
      : typeof remolque.placa === "string"
        ? remolque.placa.trim().toUpperCase()
        : "";
  if (remolqueId.startsWith("RE")) remolque.nacionalidad = "El Salvador";
  if (remolqueId.startsWith("TC")) remolque.nacionalidad = "Guatemala";
  paso9.remolque = remolque;
  data.paso9 = paso9;

  const paso7 = isRecord(data.paso7) ? data.paso7 : {};
  const gastos = isRecord(paso7.gastos) ? paso7.gastos : {};
  gastos.transporte =
    gastos.transporte === null || gastos.transporte === ""
      ? 1
      : parseMaybeNumber(gastos.transporte, 1);
  gastos.seguro =
    gastos.seguro === null || gastos.seguro === ""
      ? 1
      : parseMaybeNumber(gastos.seguro, 1);
  gastos.otros =
    gastos.otros === null || gastos.otros === ""
      ? 0
      : parseMaybeNumber(gastos.otros, 0);
  paso7.gastos = gastos;

  const mercancias = Array.isArray(paso7.mercancias) ? paso7.mercancias : [];
  paso7.mercancias = mercancias.map((item) => {
    if (!isRecord(item)) return item;
    return {
      ...item,
      numeroMercancia:
        typeof item.numeroMercancia === "string"
          ? item.numeroMercancia.replace(/[.\s]/g, "")
          : item.numeroMercancia,
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
