# SESIÓN 3B · Proyecto: duca-bot

Directorio de trabajo (único con escritura): C:\Users\Usuario\Desktop\DUCAS-BOT\duca-bot
Lectura adicional autorizada: NINGUNA. La API de la automatización está descrita en contrato/automation.openapi.json (copiado por el usuario) y el contrato de datos en contrato/CONTRATO.md.
Ajuste al bloque común: NO crees ramas; trabaja en la rama actual y al final crea la etiqueta fin-fase-3b-ducabot.

## Propósito

1. Conectar el botón "Autenticar en SIECA y enviar" con la API local de la automatización, enviando el JSON validado (parsedData) y los archivos del correo seleccionado. 2) Mostrar el progreso y permitir al operador continuar tras una pausa. 3) Popup de "cambios sin guardar" al cerrar la previsualización. Nada más.

## Decisiones fijas

- parsedData ya es el objeto "datos" del contrato: se envía tal cual, serializado.
- La URL de la automatización viene de la variable AUTOMATION_URL (por defecto http://127.0.0.1:8002). El navegador NUNCA llama a la automatización directamente: lo hace el servidor de Next mediante rutas proxy.
- NO modifiques /api/extract. La nueva ruta de envío descarga de nuevo los adjuntos seleccionados con un helper propio y nuevo (src/lib/gmail-adjuntos.ts); la duplicación de lógica es intencional. Debe usar la misma enumeración de adjuntos y el mismo filtro de extensiones (.pdf, .xls, .xlsx) que /api/extract, para que los índices seleccionados coincidan, y las mismas credenciales de Gmail (tmp/gmail_tokens.json) y errores GMAIL_AUTH_ERR.
- NO elimines /api/auth, la pantalla Conexiones ni la dependencia de playwright (Fase 5). Solo deja de usarse /api/auth desde el botón de enviar.
- Reutiliza las clases CSS existentes (card, btn, tag, modal, modal-box sm, modal-head, etc.). No toques globals.css.

## Tareas

### T1 · Estado base

Ejecuta y registra npm run lint, npx tsc --noEmit y npm test. Si Vitest falla con EPERM en la carpeta temporal, redirige TEMP y TMP a ./tmp (como en la Fase 1B). Los errores de tipos preexistentes en tests/duca-extraction.test.ts no se corrigen.

### T2 · Campos requeridos

Crea src/lib/duca-requeridos.ts con una función pura camposFaltantes(datos) que devuelva la lista legible de campos requeridos vacíos o null:

- paso1: AduanaInicio, AduanaDestino, Observaciones.
- paso2: NombreExportador, DomicilioExportador, PaisExportador.
- paso3: NombreImportador, DomicilioImportador, NumeroIdentificacionImportador, PaisImportador.
- paso5: CodigoTransportista, PlacaTransporte. paso6: LicenciaConductor.
- paso7: al menos una mercancía y, por cada una, PartidaArancelaria, DescripcionMercancia, CantidadMercancia, ClaseMercancia, PaisMercancia, PesoMercancia; gastos.ValorFOB.
- paso9: PlacaChasis, MarchamoSat, TamañoContenedor, NumeroContenedor, PaisChasis.
  No son requeridos: NumeroIdentificacionExportador, GastosTransporte, GastosSeguro, OtrosGastos, ValorTotal, paso8 (documentos) y cartaporte. Un valor 0 o "0" cuenta como presente; cadena vacía o solo espacios cuenta como faltante. Prueba unitaria en tests/duca-requeridos.test.ts con los 3 fixtures (contrato/fixtures) y un objeto completo.

### T3 · Popup de cambios sin guardar

- DucaPreviewForm.tsx: agrega la prop opcional onDraftChange?(datos, hayCambios). Se invoca en cada edición (hayCambios = true, con la copia local actual) y tras "Guardar cambios" (hayCambios = false). Debe seguir funcionando sin la prop (la usa /dev/preview).
- page.tsx: guarda el borrador y la bandera. Todas las formas de cerrar la previsualización (botón X, clic en el fondo, botón "Cerrar revisión") pasan por una función que, si hay cambios, abre un diálogo propio (no window.confirm) con el título "Hay cambios sin guardar", un texto breve y tres botones: "Guardar y cerrar" (aplica el borrador a parsedData y cierra), "Salir sin guardar" (descarta el borrador y cierra) y "Seguir editando" (cierra solo el diálogo). Sin cambios, cierra directo.
- Tras guardar o descartar, el estado queda consistente: la siguiente apertura de la previsualización muestra parsedData.

### T4 · Rutas proxy (src/app/api/automation/)

- POST /api/automation/start: recibe FormData con datos (string JSON), y mailId + selectedAttachmentIndexes, o bien file (PDF local). Obtiene los archivos con el helper nuevo y reenvía a AUTOMATION_URL/automation/start como multipart (datos + archivos con su nombre original). Devuelve tal cual el estado y el cuerpo de la automatización. Automatización inalcanzable → 503 con codigo AUTOMATION_UNAVAILABLE_ERR.
- GET /api/automation/[id], POST /api/automation/[id]/resume y POST /api/automation/[id]/cancel: proxy simple. Respeta la convención de parámetros de ruta de la versión de Next instalada.
- runtime nodejs y dynamic force-dynamic, como /api/extract.

### T5 · Botón de envío y panel de estado (page.tsx)

Reemplaza el cuerpo de authenticate() (hoy llama a /api/auth) por este flujo:

1. Si hasDiscrepancies es true: registrar error en la consola de actividad ("Aprueba las discrepancias antes de enviar") y no enviar.
2. Si camposFaltantes(parsedData) no está vacío: registrar error con la lista y mostrar un aviso en la tarjeta (usa la clase alert alert-warn) con los campos faltantes y el texto "Complétalos en Revisar DUCA T"; no enviar.
3. Enviar a /api/automation/start y guardar el id.
4. Consultar GET /api/automation/{id} cada 2 s hasta finalizado, error o cancelado. Registrar en la consola de actividad solo los cambios de estado, de paso y de pausa (sin spamear).
5. Mostrar bajo los botones un panel con: estado en español, paso actual, motivo de la pausa si existe, y los botones "Continuar" (visible en pausado; en revision_final con el texto "Ya guardé la DUCA, finalizar") y "Cancelar". Continuar llama a resume; Cancelar a cancel.
6. Mientras haya un run activo, el botón de enviar queda deshabilitado. Usa isAuthenticating como indicador de ejecución en curso para no tocar el stepper. Detén el sondeo al desmontar.
7. Mantén el texto actual del botón.
   Errores del proxy se muestran con el mismo formato [codigo] mensaje que ya usa la página.

## PROHIBIDO

- Modificar src/app/api/extract, src/app/api/auth, src/app/api/gmail, src/app/api/users, src/components/auth/**, src/components/admin/**, firebase/**, firestore.rules, src/store/**, src/types/**, src/app/duca-t/**, package.json, globals.css y configuración de Next/Tailwind/ESLint.
- Eliminar /api/auth, la pantalla Conexiones o la dependencia de playwright.
- Cambiar el contrato, el formato del JSON, las etiquetas del formulario, o el cálculo de ValorTotal.
- Agregar dependencias.
- Tocar servicio-extraccion, servicio-automatizacion o sieca-bot, ni leer .env\*.
- Enviar a la automatización datos distintos de parsedData guardado (nunca el borrador sin guardar).

## Verificación de cierre

1. lint, tsc y npm test sin errores nuevos respecto al estado base; tests de duca-requeridos en verde.
2. /dev/preview sigue funcionando con los 3 fixtures (la prop nueva es opcional).
3. git diff --stat contra la etiqueta fin-fase-1b-ducabot: SOLO page.tsx, DucaPreviewForm.tsx, src/lib/duca-requeridos.ts, src/lib/gmail-adjuntos.ts, src/app/api/automation/\*\*, tests nuevos y REPORTE_FASE_3B.md.
4. Etiqueta fin-fase-3b-ducabot creada.
5. REPORTE_FASE_3B.md con las secciones del bloque común y "Cómo validar manualmente": levantar los tres servicios, elegir un correo, extraer, editar un campo y cerrar sin guardar (aparece el popup), guardar, enviar y seguir el estado.
