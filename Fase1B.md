# SESIÓN 1B · Proyecto: duca-bot

Directorio de trabajo (único con escritura): C:\Users\Usuario\Desktop\DUCAS-BOT\duca-bot
Lectura adicional autorizada: NINGUNA. El contrato está copiado dentro de este proyecto en .\contrato\ (CONTRATO.md, contrato.schema.json, fixtures\embarque_1..3.json).

## Propósito

Alinear la previsualización de la DUCA-T (src/components/operator/DucaPreviewForm.tsx) con el contrato congelado y comprobar que los 3 fixtures se muestran completos. El resto de la aplicación funciona y NO se toca.

## Tareas

### T1 · Estado base

Ejecuta y registra: npm run lint ; npm test ; npx tsc --noEmit. Registra los fallos preexistentes. No instales ni actualices paquetes.

### T2 · Auditoría contra el contrato (solo lectura, antes de editar)

Lee contrato/CONTRATO.md y los fixtures. Compara cada clave que lee o escribe DucaPreviewForm.tsx con el contrato (paso1..paso9, paso7.gastos, paso7.mercancias[], paso8.\*). Lista todas las diferencias en el reporte ANTES de corregir. Diferencia ya conocida: DOCUMENT_BLOCKS usa key "porte" y el contrato usa "cartaporte".

### T3 · Correcciones permitidas (todas en DucaPreviewForm.tsx, cambios mínimos)

a) Corregir la key "porte" → "cartaporte" en DOCUMENT_BLOCKS.
b) Cualquier otra clave que difiera del contrato, corregida para coincidir con el contrato (nunca al revés).
c) Robustez ante null y vacíos: ningún campo null/undefined, lista vacía (mercancias, paso8.\*) o paso ausente debe lanzar excepción ni mostrar "undefined"/"null". Los campos null se ven como input vacío y editable. Si una categoría de paso8 está vacía, mostrar el bloque con el texto "Sin documentos" en lugar de ocultarlo (así el operador sabe que no se detectó).
d) Valores numéricos que lleguen como string o número (gastos, cantidad, peso) se muestran sin romperse.
Prohibido cambiar estilos, textos de etiquetas, estructura visual, orden de pasos, o el cálculo de ValorTotal.

### T4 · Prueba automatizada del contrato en el front

Crea tests/contrato-fixtures.test.ts (vitest, entorno node, sin dependencias nuevas) que, para cada fixture, verifique que existen todas las claves que DucaPreviewForm consume (defínelas en el test como lista explícita tomada del componente) y que paso8 tiene las 4 categorías (cartaporte, facturas, manifiestos, otros) como arreglos.

### T5 · Verificación visual con fixtures (aislada y solo en desarrollo)

Crea src/app/dev/preview/page.tsx, SOLO para desarrollo: si process.env.NODE_ENV === "production" debe devolver notFound(). Contiene un input de archivo JSON y, al cargarlo, renderiza <DucaPreviewForm> con hasDiscrepancies/discrepancyDetails del JSON (los fixtures son el objeto "datos", que incluye ambos). No usa Firebase ni Gmail ni red. Esta página es temporal y se eliminará en la Fase 5; indícalo con un comentario en la primera línea. Cárgala con los 3 fixtures y registra qué se ve vacío o raro en cada uno (describe, no corrijas más allá de T3).

## PROHIBIDO en esta sesión

- Modificar: src/app/api/** (incluidos extract, gmail, auth, users), src/components/auth/**, src/components/admin/**, firebase/**, firestore.rules, src/store/**, src/types/**, src/app/duca-t/\*\* (flujo antiguo), src/app/page.tsx, ProtectedShell, estilos globales, package.json, configuración de Next/Tailwind/ESLint.
- Eliminar /api/auth o la dependencia de playwright (eso es de la Fase 3).
- Cambiar cómo se envía o recibe el JSON del microservicio, ni el contrato.
- Agregar librerías (por ejemplo, de testing de React).
- Tocar servicio-extraccion, servicio-automatizacion o sieca-bot.
- Leer o mostrar el contenido de .env\*.

## Verificación de cierre

1. lint, tsc y npm test: sin errores nuevos respecto al estado base.
2. tests/contrato-fixtures.test.ts en verde con los 3 fixtures.
3. /dev/preview muestra los 3 fixtures sin errores en consola del navegador.
4. git diff --stat contra pre-fase-1b: SOLO DucaPreviewForm.tsx, tests/contrato-fixtures.test.ts, src/app/dev/preview/page.tsx, la carpeta contrato/ (si no estaba versionada) y REPORTE_FASE_1B.md.
5. Etiqueta fin-fase-1b-ducabot creada.
6. En el reporte, agrega "Observaciones para la Fase 3": cómo el estado parsedData llega a la acción de enviar a SIECA y si los cambios del operador se pierden si no pulsa "Guardar cambios" (solo describir).
