type Registro = Record<string, unknown>;

const camposSimples = [
  ["paso1", "AduanaInicio", "Aduana de inicio"],
  ["paso1", "AduanaDestino", "Aduana de destino"],
  ["paso1", "Observaciones", "Observaciones"],
  ["paso2", "NombreExportador", "Nombre del exportador"],
  ["paso2", "DomicilioExportador", "Domicilio del exportador"],
  ["paso2", "PaisExportador", "País del exportador"],
  ["paso3", "NombreImportador", "Nombre del importador"],
  ["paso3", "DomicilioImportador", "Domicilio del importador"],
  ["paso3", "NumeroIdentificacionImportador", "Número de identificación del importador"],
  ["paso3", "PaisImportador", "País del importador"],
  ["paso5", "CodigoTransportista", "Código del transportista"],
  ["paso5", "PlacaTransporte", "Placa de transporte"],
  ["paso6", "LicenciaConductor", "Licencia del conductor"],
  ["paso9", "PlacaChasis", "Placa del chasis"],
  ["paso9", "MarchamoSat", "Marchamo SAT"],
  ["paso9", "TamañoContenedor", "Tamaño del contenedor"],
  ["paso9", "NumeroContenedor", "Número de contenedor"],
  ["paso9", "PaisChasis", "País del chasis"],
] as const;

const camposMercancia = [
  ["PartidaArancelaria", "partida arancelaria"],
  ["DescripcionMercancia", "descripción"],
  ["CantidadMercancia", "cantidad"],
  ["ClaseMercancia", "clase"],
  ["PaisMercancia", "país"],
  ["PesoMercancia", "peso"],
] as const;

function esRegistro(value: unknown): value is Registro {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function estaVacio(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

export function camposFaltantes(datos: unknown): string[] {
  const raiz = esRegistro(datos) ? datos : {};
  const faltantes: string[] = [];

  for (const [paso, campo, etiqueta] of camposSimples) {
    const seccion = raiz[paso];
    if (!esRegistro(seccion) || estaVacio(seccion[campo])) faltantes.push(etiqueta);
  }

  const paso7 = raiz.paso7;
  const mercancias = esRegistro(paso7) && Array.isArray(paso7.mercancias) ? paso7.mercancias : [];
  if (mercancias.length === 0) faltantes.push("Al menos una mercancía");
  mercancias.forEach((mercancia, indice) => {
    for (const [campo, etiqueta] of camposMercancia) {
      if (!esRegistro(mercancia) || estaVacio(mercancia[campo])) {
        faltantes.push(`Mercancía ${indice + 1}: ${etiqueta}`);
      }
    }
  });

  const gastos = esRegistro(paso7) ? paso7.gastos : undefined;
  if (!esRegistro(gastos) || estaVacio(gastos.ValorFOB)) faltantes.push("Valor FOB");
  return faltantes;
}
