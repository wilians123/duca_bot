import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const FIXTURES = ["embarque_1.json", "embarque_2.json", "embarque_3.json"];

// Claves leídas o escritas por DucaPreviewForm, en la forma que aparecen en el JSON.
const DATA_PATHS = [
  "paso1.PaisProcedencia",
  "paso1.AduanaInicio",
  "paso1.PaisDestino",
  "paso1.AduanaDestino",
  "paso1.Observaciones",
  "paso2.NombreExportador",
  "paso2.DomicilioExportador",
  "paso2.TipoIdentificacionExportador",
  "paso2.NumeroIdentificacionExportador",
  "paso2.PaisExportador",
  "paso3.NombreImportador",
  "paso3.DomicilioImportador",
  "paso3.TipoIdentificacionImportador",
  "paso3.NumeroIdentificacionImportador",
  "paso3.PaisImportador",
  "paso4.AduanaPaso",
  "paso5.CodigoTransportista",
  "paso5.PlacaTransporte",
  "paso6.LicenciaConductor",
  "paso7.gastos.ValorFOB",
  "paso7.gastos.GastosTransporte",
  "paso7.gastos.GastosSeguro",
  "paso7.gastos.OtrosGastos",
  "paso7.gastos.ValorTotal",
  "paso7.mercancias.0.PartidaArancelaria",
  "paso7.mercancias.0.DescripcionMercancia",
  "paso7.mercancias.0.CantidadMercancia",
  "paso7.mercancias.0.ClaseMercancia",
  "paso7.mercancias.0.PaisMercancia",
  "paso7.mercancias.0.PesoMercancia",
  "paso9.TipoEquipamiento",
  "paso9.TipoCarga",
  "paso9.PlacaChasis",
  "paso9.PaisChasis",
  "paso9.NumeroContenedor",
  "paso9.TamañoContenedor",
  "paso9.MarchamoSat",
];

const DOCUMENT_FIELDS = [
  ["cartaporte", "NombreDocumentoPorte", "TipoDocumentoPorte", "NumeroDocumentoPorte"],
  ["facturas", "NombreDocumentoFactura", "TipoDocumentoFactura", "NumeroDocumentoFactura"],
  ["manifiestos", "NombreDocumentoManifiesto", "TipoDocumentoManifiesto", "NumeroDocumentoManifiesto"],
  ["otros", "NombreDocumentoBL", "TipoDocumentoManifiestoBL", "NumeroDocumentoManifiestoBL"],
] as const;

function readPath(value: unknown, dottedPath: string): unknown {
  return dottedPath.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);
}

function readFixture(name: string): Record<string, unknown> {
  const fixturePath = path.resolve(process.cwd(), "contrato", "fixtures", name);
  return JSON.parse(readFileSync(fixturePath, "utf8")) as Record<string, unknown>;
}

describe("fixtures del contrato congelado de DUCA-T", () => {
  it.each(FIXTURES)("%s contiene las claves consumidas por DucaPreviewForm", (name) => {
    const fixture = readFixture(name);

    for (const dataPath of DATA_PATHS) {
      expect(readPath(fixture, dataPath), `${name}: ${dataPath}`).not.toBeUndefined();
    }

    expect(fixture.hasDiscrepancies, `${name}: hasDiscrepancies`).not.toBeUndefined();
    expect(fixture.discrepancyDetails, `${name}: discrepancyDetails`).not.toBeUndefined();

    const paso8 = fixture.paso8 as Record<string, unknown>;
    for (const [category, ...fields] of DOCUMENT_FIELDS) {
      const documents = paso8[category];
      expect(Array.isArray(documents), `${name}: paso8.${category} debe ser un arreglo`).toBe(true);
      if (Array.isArray(documents)) {
        for (const document of documents) {
          for (const field of fields) {
            expect(document, `${name}: paso8.${category}[]`).toHaveProperty(field);
          }
        }
      }
    }
  });
});
