# Contrato DUCA-T v1.0 — CONGELADO

Fecha: 2026-10-12

Los cambios solo pasan por BUGS.md y se recopian manualmente a los demás proyectos.

Este contrato describe la salida actual del servicio y los tipos observados en `fixtures/embarque_1..3.json`. Los ejemplos se copiaron de esos fixtures; no son datos de referencia para nuevas declaraciones.

## 1. Endpoint y envoltura

`POST /api/v1/extract` recibe los adjuntos en `archivos`, el texto opcional en `cuerpo_correo` y la cabecera `X-API-Key`.

En éxito responde HTTP 200 con:

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `ok` | boolean | `true` si terminó la extracción. |
| `datos` | objeto `DucaTForm` | Campos globales y pasos 1 a 9 definidos en este contrato. |
| `archivosProcesados` | string[] | Nombres de los adjuntos PDF/XLS/XLSX procesados. |
| `archivosDescartados` | string[] | Nombres de archivos Word descartados. |
| `archivosJson` | objeto[] | Evidencia de entrada: `nombreArchivo` y `datos` con el cuerpo del correo o el texto extraído de cada archivo. No forma parte de `DucaTForm`. |

Los errores de servicio usan `{ "ok": false, "error": { "codigo": "...", "mensaje": "...", "detalle": "..." } }`; `detalle` es opcional. Códigos y estados actuales:

| HTTP | `codigo` | Caso |
| --- | --- | --- |
| 400 | `ARCHIVO_NO_PERMITIDO_ERR` | No hay adjuntos admitidos. |
| 400 | `ARCHIVO_NO_PERMITIDO_ERR` | No hay archivos válidos para procesar. |
| 422 | `PDF_EXTRACTION_ERR`, `EXCEL_EXTRACTION_ERR` u `OCR_ERR` | Falló la extracción de un documento. |
| 502 | `AI_RESPONSE_ERR` | La respuesta de IA no cumple el formato esperado. |
| 503 | `AI_UNAVAILABLE_ERR` | La IA no está disponible o agotó el tiempo global. |
| 500 | `MICROSERVICE_CRASH_ERR` | Error inesperado durante extracción u orquestación. |

La cabecera ausente o inválida responde HTTP 401; si no está configurada, responde HTTP 503. Actualmente esas dos respuestas son las excepciones HTTP estándar de FastAPI (`detail`) y no usan la envoltura anterior. Se documenta como comportamiento actual.

## 2. Campos de `paso1`

| Campo | Tipo observado en fixtures | Ejemplo del fixture | Valor fijo (sí/no y cuál) | Normalización/formato exacto | Puede ser null | Consumidor previsto |
| --- | --- | --- | --- | --- | --- | --- |
| `PaisProcedencia` | string | `GUATEMALA` | Sí: `GUATEMALA` | Valor exacto en mayúsculas. | No | UI / automatización |
| `AduanaInicio` | string | `ADUANA SANTO TOMAS DE CASTILLA - ST - ADUANA PORTUARIA` | No; regla provisional | Elegir exactamente una de las dos aduanas portuarias permitidas según evidencia; si es ambiguo o no hay evidencia, null. | Sí | UI / automatización |
| `PaisDestino` | string | `EL SALVADOR` | Sí: `EL SALVADOR` | Valor exacto en mayúsculas. | No | UI / automatización |
| `AduanaDestino` | string | `ALM.GRAL.DEPOSITO OCCIDENTE (APOPA) - 83 - ADUANA PORTUARIA` | No; regla provisional | Valor exacto de la lista cerrada del manual, usando evidencia de `EN TRANSITO A` y su código. | Sí | UI / automatización |
| `Observaciones` | string | `MBL: NAM8722259 BUQUE LITTLE SYMPHONY VIAJE YUK020N19 FECHA 12-10-2026. EN TRANSITO A ALM.GRAL.DEPOSITO OCCIDENTE CODIGO 83. AGENTE DESPACHADOR CMA CGM GASTOS DE SEGURO $1.00, GASTOS DE TRANSPORTE $1.00 UNICAMENTE PARA EFECTOS DEL REGISTRO ADUANERO.` | No | Texto plano, segmentos en orden: `MBL: <mbl> HBL:<hbl> BUQUE <buque> VIAJE <viaje> FECHA <fecha>. EN TRANSITO A <aduana> CODIGO <codigo>. AGENTE DESPACHADOR <agente>`. Se omite `HBL:` si no hay HBL. El mensaje condicional de gastos va al final, separado por un espacio. | Sí | UI / automatización |

### Formato exacto de `Observaciones`

La plantilla, orden, etiquetas y texto condicional son los indicados en la fila anterior y en `app/ai/prompts/duca_t_extraction.md`. Las fechas se conservan como las presenta la fuente prioritaria. `DECLARACION NO.` solo se agrega si existe una DUCA-D con número. El manual menciona este segmento, pero su plantilla de formato y ejemplos no definen dónde insertarlo; queda pendiente precisar su posición. No es una clave independiente de `paso1`.

## 3. Campos de `paso2`

| Campo | Tipo observado en fixtures | Ejemplo del fixture | Valor fijo (sí/no y cuál) | Normalización/formato exacto | Puede ser null | Consumidor previsto |
| --- | --- | --- | --- | --- | --- | --- |
| `NombreExportador` | string | `SONOCO DE COLOMBIA LTDA` | No | Texto del bloque `SHIPPER` del HBL si existe; si no, MBL. | Sí | UI / automatización |
| `DomicilioExportador` | string | `PO Box 297 Stanford, KY 40484 USA` | No | Dirección del mismo bloque y documento que el nombre; conservar el texto. | Sí | UI / automatización |
| `TipoIdentificacionExportador` | string | `NÚMERO DE IDENTIFICACIÓN TRIBUTARIA` | Sí: `NÚMERO DE IDENTIFICACIÓN TRIBUTARIA` | Literal, con acentos y mayúsculas. | No | UI / automatización |
| `NumeroIdentificacionExportador` | string | `S/N` (fixture 1); `890302609-0` (fixture 2) | No uniforme: el manual define `S/N`, pero los fixtures varían | Conservar el valor observado según la respuesta de extracción. | Sí según el modelo | UI / automatización |
| `PaisExportador` | string | `COLOMBIA` | No | Nombre completo del país en español. | Sí | UI / automatización |

## 4. Campos de `paso3`

| Campo | Tipo observado en fixtures | Ejemplo del fixture | Valor fijo (sí/no y cuál) | Normalización/formato exacto | Puede ser null | Consumidor previsto |
| --- | --- | --- | --- | --- | --- | --- |
| `NombreImportador` | string | `B&C LUXURY AUTO SA DE CV` | No | Bloque `CONSIGNEE` del HBL si existe; si no, MBL. | Sí | UI / automatización |
| `DomicilioImportador` | string | `KM 32 1/2 CARRETERA A SAN JUAN OPICO SITIO DEL NINO, LA LIBERTAD, LA LIBERTAD` | No | Dirección del mismo bloque y documento que el nombre; conservar el texto. | Sí | UI / automatización |
| `TipoIdentificacionImportador` | string | `NÚMERO DE IDENTIFICACIÓN TRIBUTARIA` | Sí: `NÚMERO DE IDENTIFICACIÓN TRIBUTARIA` | Literal, con acentos y mayúsculas. | No | UI / automatización |
| `NumeroIdentificacionImportador` | string | `06141111201069` | No | HBL/MBL o casilla NIT autorizada; eliminar guiones y espacios. | Sí | UI / automatización |
| `PaisImportador` | string | `EL SALVADOR` | No | Nombre completo del país en español. | Sí | UI / automatización |

## 5. Campos de `paso4`

| Campo | Tipo observado en fixtures | Ejemplo del fixture | Valor fijo (sí/no y cuál) | Normalización/formato exacto | Puede ser null | Consumidor previsto |
| --- | --- | --- | --- | --- | --- | --- |
| `AduanaPaso` | string | `ADUANA LA ERMITA LE ADUANA FRONTERA` | Sí: `ADUANA LA ERMITA LE ADUANA FRONTERA` | Literal. | No | UI / automatización |

## 6. Campos de `paso5`

| Campo | Tipo observado en fixtures | Ejemplo del fixture | Valor fijo (sí/no y cuál) | Normalización/formato exacto | Puede ser null | Consumidor previsto |
| --- | --- | --- | --- | --- | --- | --- |
| `CodigoTransportista` | null | `null` | No | Código del documento del piloto: prefijo `GT` o `SV`; quitar espacios, guiones, dos puntos y separadores OCR. | Sí | UI / automatización |
| `PlacaTransporte` | null | `null` | No | Placa del cabezal; para el formato `C0 - ...`, quitar separadores y el `0` inmediatamente posterior a `C`. | Sí | UI / automatización |

## 7. Campos de `paso6`

| Campo | Tipo observado en fixtures | Ejemplo del fixture | Valor fijo (sí/no y cuál) | Normalización/formato exacto | Puede ser null | Consumidor previsto |
| --- | --- | --- | --- | --- | --- | --- |
| `LicenciaConductor` | null | `null` | No | DPI/DUI del piloto según la prioridad del manual; conservar dígitos identificados. | Sí | UI / automatización |

## 8. Campos de `paso7`

### `gastos`

| Campo | Tipo observado en fixtures | Ejemplo del fixture | Valor fijo (sí/no y cuál) | Normalización/formato exacto | Puede ser null | Consumidor previsto |
| --- | --- | --- | --- | --- | --- | --- |
| `gastos.ValorFOB` | number / string | `50816.16` (fixture 1); `14535.66` (fixture 3) | No | Final de columna `VALOR` o campo 25 de DUCA-D; no calcular. | Sí | UI / automatización |
| `gastos.GastosTransporte` | number / null | `0` (fixture 2) | No | Final de columna `FLETE` o campo 26 de DUCA-D. | Sí | UI / automatización |
| `gastos.GastosSeguro` | number / null | `0` (fixture 2) | No | Final de columna `SEGURO` o campo 27 de DUCA-D. | Sí | UI / automatización |
| `gastos.OtrosGastos` | null | `null` | No | Final de columna `OTROS` o campo 28 de DUCA-D. | Sí | UI / automatización |
| `gastos.ValorTotal` | null | `null` | No | Solo si la fuente autorizada rotula explícitamente un total; no sumar campos. | Sí | UI / automatización |

### `mercancias[]`

| Campo | Tipo observado en fixtures | Ejemplo del fixture | Valor fijo (sí/no y cuál) | Normalización/formato exacto | Puede ser null | Consumidor previsto |
| --- | --- | --- | --- | --- | --- | --- |
| `mercancias[].PartidaArancelaria` | string | `87032369910` | No | Columna `PARTIDA` o clasificación arancelaria de DUCA-D; conservar el código como texto. | Sí | UI / automatización |
| `mercancias[].DescripcionMercancia` | string | `VIN:3N1AB8CV2MY207279 2021 NISSAN SENTRA RED` | No | Texto de `MERCADERIA`; para vehículos anteponer `VIN:<VIN> ` con evidencia. | Sí | UI / automatización |
| `mercancias[].CantidadMercancia` | number / string | `208` (fixture 2); `1` (fixture 3) | No | Cantidad de bultos de la columna `BULTOS` o DUCA-D. | Sí | UI / automatización |
| `mercancias[].ClaseMercancia` | string | `VN` (fixture 3); `PK` (fixture 2) | Sí, condicional: `VN` para vehículos y `PK` para otras mercancías | Literal según el tipo de mercancía. | Sí en el tipo del modelo; regla funcional la determina | UI / automatización |
| `mercancias[].PaisMercancia` | string | `ESTADOS UNIDOS` | No | País de origen de la fila `ORIGEN DE LA CARGA` o DUCA-D; el manual pide nombre en español. | Sí | UI / automatización |
| `mercancias[].PesoMercancia` | number / string | `19428.595` (fixture 1); `1378.01` (fixture 3) | No | Peso bruto en kg de `PESO` o DUCA-D. | Sí | UI / automatización |

## 9. Campos de `paso8`

Cada categoría es un arreglo. Cuando no hay documento de esa clase, el valor es `[]`. Los campos de cada objeto son strings o null. El nombre debe coincidir exactamente con el archivo adjunto.

| Campo | Tipo observado en fixtures | Ejemplo del fixture | Valor fijo (sí/no y cuál) | Normalización/formato exacto | Puede ser null | Consumidor previsto |
| --- | --- | --- | --- | --- | --- | --- |
| `cartaporte[]` | array | `[]` | No | Cada objeto: `NombreDocumentoPorte`, `TipoDocumentoPorte`, `NumeroDocumentoPorte`; reglas pendientes, solo evidencia literal. | La lista no; campos del objeto sí | UI / automatización |
| `cartaporte[].NombreDocumentoPorte` | string / null | Sin objeto en los fixtures (`cartaporte = []`) | No | Nombre exacto del archivo adjunto. | Sí | UI / automatización |
| `cartaporte[].TipoDocumentoPorte` | string / null | Sin objeto en los fixtures (`cartaporte = []`) | No | Solo con evidencia literal; regla pendiente. | Sí | UI / automatización |
| `cartaporte[].NumeroDocumentoPorte` | string / null | Sin objeto en los fixtures (`cartaporte = []`) | No | Solo con evidencia literal; regla pendiente. | Sí | UI / automatización |
| `facturas[]` | array de objetos | `facturas[0].TipoDocumentoFactura = FACTURA COMERCIAL` (fixture 3) | Tipo sí cuando se identifica factura comercial | Un objeto por archivo. Números múltiples en el mismo archivo se separan por `/`. | Campos del objeto sí | UI / automatización |
| `facturas[].NombreDocumentoFactura` | string | `Consol Facturas (52).pdf` | No | Nombre exacto del adjunto. | Sí | UI / automatización |
| `facturas[].TipoDocumentoFactura` | string | `FACTURA COMERCIAL` | Sí cuando aplica | Literal `FACTURA COMERCIAL`. | Sí | UI / automatización |
| `facturas[].NumeroDocumentoFactura` | string | `27237452/57957556/27290163/55757916/62971466/27277013` | No | Número o números documentales separados por `/`. | Sí | UI / automatización |
| `manifiestos[]` | array de objetos | `manifiestos[0].TipoDocumentoManifiesto = MANIFIESTO DE CARGA` (fixture 3) | Tipo sí cuando se identifica manifiesto | Un objeto por archivo. Número tomado exclusivamente del cuerpo del correo. | Campos del objeto sí | UI / automatización |
| `manifiestos[].NombreDocumentoManifiesto` | string | `NAM8689177-MN.pdf` | No | Nombre exacto del adjunto. | Sí | UI / automatización |
| `manifiestos[].TipoDocumentoManifiesto` | string | `MANIFIESTO DE CARGA` | Sí cuando aplica | Literal `MANIFIESTO DE CARGA`. | Sí | UI / automatización |
| `manifiestos[].NumeroDocumentoManifiesto` | string / null | `CC126001086` | No | Solo desde el cuerpo del correo. | Sí | UI / automatización |
| `otros[]` | array de objetos | `otros[0].TipoDocumentoManifiestoBL = Conocimiento de embarque máster` (fixture 3) | Tipo sí según MBL/HBL | Solo MBL/HBL; si existen ambos, HBL primero y MBL después. | Campos del objeto sí | UI / automatización |
| `otros[].NombreDocumentoBL` | string | `NAM8689177-OBL.pdf` | No | Nombre exacto del adjunto. | Sí | UI / automatización |
| `otros[].TipoDocumentoManifiestoBL` | string | `Conocimiento de embarque máster` | Sí según clase de BL | HBL: `Conocimiento de embarque hija`; MBL: `Conocimiento de embarque máster`. | Sí | UI / automatización |
| `otros[].NumeroDocumentoManifiestoBL` | string | `NAM8689177` | No | Número de MBL/HBL según el documento. | Sí | UI / automatización |

## 10. Campos de `paso9`

| Campo | Tipo observado en fixtures | Ejemplo del fixture | Valor fijo (sí/no y cuál) | Normalización/formato exacto | Puede ser null | Consumidor previsto |
| --- | --- | --- | --- | --- | --- | --- |
| `TipoEquipamiento` | string | `CONTENEDOR` | Sí: `CONTENEDOR` | Literal en mayúsculas. | No | UI / automatización |
| `TipoCarga` | string | `CONTENERIZADA` | Sí: `CONTENERIZADA` | Literal en mayúsculas. | No | UI / automatización |
| `PlacaChasis` | null | `null` | No | Placa de remolque/chasis, no del cabezal; quitar únicamente espacios y guiones internos. | Sí | UI / automatización |
| `MarchamoSat` | string / null | `SAT-GT 732668` (fixture 3) | No; prefijo de formato `SAT-GT ` | Fuente del número pendiente; ante evidencia, agregar el prefijo sin duplicarlo. | Sí | UI / automatización |
| `TamañoContenedor` | string | `40` (fixture 1); `45` (fixture 3) | No; valores permitidos `20`, `40`, `45` | Tomar del MBL: `20ST` → `20`, `40HC` → `40`, `45HC` → `45`; la salida observada es string. | Sí | UI / automatización |
| `NumeroContenedor` | string | `TDRU9580107` | No | Debe contrastar cuerpo, Excel, MBL y HBL. Si hay conflicto sin prioridad, null y discrepancia. | Sí | UI / automatización |
| `PaisChasis` | null | `null` | No; regla condicional por prefijo | `RE` → `SALVADOR`; `TC` → `GUATEMALA`; otros prefijos → null. | Sí | UI / automatización |

## 11. Discrepancias

`hasDiscrepancies` es boolean. `discrepancyDetails` es string o null, como declara el modelo y muestran los fixtures: fixture 2 usa `false` y `null`; fixtures 1 y 3 usan `true` y una cadena con los datos y fuentes en conflicto. El texto de detalle no tiene un formato único garantizado; el operador debe poder leerlo.

El manual dice que, sin discrepancias, `discrepancyDetails` debe ser una lista vacía. Eso contradice el modelo y la salida observada; para este contrato congelado rige string o null.

## 12. Cómo tratar null y números

Un consumidor no debe convertir `null` en un valor inferido. La automatización debe pausar para revisión del operador si el campo requerido para continuar es null. La UI debe mostrarlo vacío y editable.

Los importes, pesos y cantidades llegan como string o number según el campo y el fixture. Los consumidores deben tolerar ambos tipos sin perder precisión ni alterar el valor mostrado. Los datos numéricos no deben asumirse siempre como JSON number.

## 13. Reglas pendientes o provisionales

- `ValorTotal`: regla provisional del manual: solo devolver un total rotulado explícitamente en Excel o DUCA-D; no calcular. El bot actual de SIECA no lo llena porque el portal lo calcula; `duca-bot` lo recalcula en el frontend.
- `MarchamoSat`: no está definida la fuente documental del número. Si hay evidencia, anteponer `SAT-GT `; si no, null.
- `cartaporte`: no hay reglas de extracción definidas. Mantener `[]` si no existe documento.
- `AduanaInicio` y `AduanaDestino`: reglas provisionales del manual. `AduanaInicio` depende de menciones de puerto y evidencia de ingreso; `AduanaDestino` corresponde a `EN TRANSITO A` dentro de la lista cerrada.
- El manual declara `NumeroIdentificacionExportador = S/N`, pero el fixture 2 contiene `890302609-0`. El contrato conserva la salida real y reporta la discrepancia para resolverla en `BUGS.md`.
- El manual pide devolver `PaisMercancia` como nombre completo en español; el fixture 1 conserva `US`. No se normalizó el fixture.
- El manual describe el segmento `DECLARACION NO.` de `Observaciones`, pero no especifica su ubicación en la plantilla exacta.

## 14. Tipos numéricos

`ValorFOB`, gastos, cantidades y pesos aparecen como JSON number en unos fixtures y como string en otros; el schema acepta `string`, `number` y `null` para estos campos. `TamañoContenedor` aparece como string (`20`, `40` o `45`).
