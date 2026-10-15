import { describe, expect, it } from "vitest";
import fixture1 from "../contrato/fixtures/embarque_1.json";
import fixture2 from "../contrato/fixtures/embarque_2.json";
import fixture3 from "../contrato/fixtures/embarque_3.json";
import { camposFaltantes } from "@/lib/duca-requeridos";

describe("camposFaltantes", () => {
  it.each([fixture1, fixture2, fixture3])("detecta los campos requeridos ausentes en los fixtures", (datos) => {
    expect(camposFaltantes(datos)).toContain("Código del transportista");
    expect(camposFaltantes(datos)).toContain("Placa de transporte");
    expect(camposFaltantes(datos)).toContain("Licencia del conductor");
    expect(camposFaltantes(datos)).toContain("Placa del chasis");
    expect(camposFaltantes(datos)).toContain("País del chasis");
  });

  it("acepta un objeto completo y considera cero como presente", () => {
    const datos = {
      paso1: { AduanaInicio: "A", AduanaDestino: "B", Observaciones: "O" },
      paso2: { NombreExportador: "A", DomicilioExportador: "B", PaisExportador: "C" },
      paso3: { NombreImportador: "A", DomicilioImportador: "B", NumeroIdentificacionImportador: "0", PaisImportador: "C" },
      paso5: { CodigoTransportista: "0", PlacaTransporte: "P" },
      paso6: { LicenciaConductor: "L" },
      paso7: {
        mercancias: [{ PartidaArancelaria: "0", DescripcionMercancia: "D", CantidadMercancia: 0, ClaseMercancia: "C", PaisMercancia: "P", PesoMercancia: "0" }],
        gastos: { ValorFOB: 0 },
      },
      paso9: { PlacaChasis: "C", MarchamoSat: "M", TamañoContenedor: "40", NumeroContenedor: "N", PaisChasis: "G" },
    };
    expect(camposFaltantes(datos)).toEqual([]);
  });
});
