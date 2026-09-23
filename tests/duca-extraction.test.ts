import { describe, it, expect } from "vitest";
import { cleanDucaData, parseJsonFromModel } from "@/lib/duca-data";

describe("DUCA Extraction Utilities", () => {
  describe("parseJsonFromModel", () => {
    it("debe extraer JSON puro de un string con markdown fences", () => {
      const rawText = "\`\`\`json\n{ \"clave\": \"valor\" }\n\`\`\`";
      const result = parseJsonFromModel(rawText);
      expect(result).toEqual({ clave: "valor" });
    });

    it("debe extraer JSON ignorando texto basura antes y despues", () => {
      const rawText = "Aqui esta la data: \n{ \"paso7\": { \"mercancias\": [] } }\nEspero te sirva.";
      const result = parseJsonFromModel(rawText);
      expect(result).toEqual({ paso7: { mercancias: [] } });
    });
  });

  describe("cleanDucaData", () => {
    it("debe limpiar los campos del conductor correctamente en paso6", () => {
      const input = {
        paso6: {
          documento: "0203-9206-1 ",
          licencia: " GT 238548740 1801 08781 ",
        },
      };
      const cleaned = cleanDucaData(input);
      expect(cleaned.paso6).toMatchObject({
        documento: "020392061",
        licencia: "GT238548740180108781",
      });
    });

    it("debe formatear el código de transportista quitando 'SV:' en paso5", () => {
      const input = {
        paso5: {
          transportista: {
            codigo: "SV: CODIGO-PRUEBA",
          }
        }
      };
      const cleaned = cleanDucaData(input);
      expect(cleaned.paso5.transportista).toMatchObject({
        codigo: "CODIGO-PRUEBA"
      });
    });

    it("debe limpiar el marchamo asegurando el prefijo SAT-GT en paso9", () => {
      const input1 = { paso9: { marchamo: "SAT-GT 6356940" } };
      const input2 = { paso9: { marchamo: "6356940" } };
      const input3 = { paso9: { marchamo: " sat-gt   1234 " } };

      expect(cleanDucaData(input1).paso9.marchamo).toBe("SAT-GT 6356940");
      expect(cleanDucaData(input2).paso9.marchamo).toBe("SAT-GT 6356940");
      expect(cleanDucaData(input3).paso9.marchamo).toBe("SAT-GT 1234");
    });

    it("debe determinar la nacionalidad del remolque según el prefijo del chasis/placa en paso9", () => {
      const inputElSalvador = { paso9: { remolque: { chasis: " RE1238 " } } };
      const inputGuatemala = { paso9: { remolque: { placa: "TC-123VZG" } } };

      expect(cleanDucaData(inputElSalvador).paso9.remolque).toMatchObject({ nacionalidad: "El Salvador" });
      expect(cleanDucaData(inputGuatemala).paso9.remolque).toMatchObject({ nacionalidad: "Guatemala" });
    });

    it("debe limpiar las mercancías y el código de partida arancelaria en paso7", () => {
      const input = {
        paso7: {
          mercancias: [
            {
              numeroMercancia: "1112.123123.123123 ",
              cantidad: " 15 ",
              bultos: " 20.5 ",
              pesoBruto: null,
            },
          ],
        }
      };
      const cleaned = cleanDucaData(input);
      expect(cleaned.paso7.mercancias[0]).toMatchObject({
        numeroMercancia: "1112123123123123",
        cantidad: 15,
        bultos: 20.5,
        pesoBruto: 0,
      });
    });

    it("debe aplicar valores predeterminados para gastos en paso7", () => {
      const inputEmpty = { paso7: { gastos: {} } };
      const cleanedEmpty = cleanDucaData(inputEmpty);
      expect(cleanedEmpty.paso7.gastos).toMatchObject({
        transporte: 1,
        seguro: 1,
        otros: 0,
      });

      const inputValues = { paso7: { gastos: { transporte: "500.50", seguro: 100, otros: 10 } } };
      const cleanedValues = cleanDucaData(inputValues);
      expect(cleanedValues.paso7.gastos).toMatchObject({
        transporte: 500.5,
        seguro: 100,
        otros: 10,
      });
    });
  });
});
