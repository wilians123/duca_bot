# Reporte Fase 3B

## Resumen

Se implementó la validación de campos requeridos, el borrador con confirmación al cerrar la revisión y el envío mediante rutas proxy locales hacia la automatización. Los datos enviados son el `parsedData` guardado; el borrador no guardado no se envía.

## Cambios realizados

- `src/lib/duca-requeridos.ts`: comprobación de campos de los pasos 1, 2, 3, 5, 6, 7 y 9; acepta `0` y `"0"` como valores presentes.
- `src/components/operator/DucaPreviewForm.tsx` y `src/app/page.tsx`: notificación opcional de cambios del borrador y diálogo propio con las tres acciones solicitadas.
- `src/lib/gmail-adjuntos.ts`: descarga de adjuntos Gmail con la enumeración, extensiones permitidas y credenciales establecidas.
- `src/app/api/automation/`: rutas proxy para iniciar, consultar, continuar y cancelar ejecuciones.
- `tests/duca-requeridos.test.ts`: cobertura de los tres fixtures y un objeto completo, incluidos valores cero.

## Verificación

| Comando | Línea base | Resultado final |
| --- | --- | --- |
| `npm run lint` | Sin errores | Sin errores |
| `npx tsc --noEmit` | Falla en `.next/dev/types/validator.ts` con TS1109 en líneas 62–66 | La visita a Next dev regeneró esos tipos; quedaron los errores preexistentes en `tests/duca-extraction.test.ts` (líneas 43, 53–55, 62–63, 80, 91 y 99). No se corrigieron según la instrucción |
| `npm test` | 2 archivos, 11 pruebas aprobadas | 3 archivos, 15 pruebas aprobadas |

`/dev/preview` respondió HTTP 200 en Next.js 16.2.12 y mostró la pantalla de carga de fixtures. La prop `onDraftChange` es opcional y la página de previsualización sigue usando el formulario sin esa prop. No se comprobó la carga interactiva de los tres JSON en el navegador desde esta sesión.

## Alcance del diff

Los cambios de esta fase están en `page.tsx`, `DucaPreviewForm.tsx`, los nuevos archivos de `src/lib`, las rutas de `src/app/api/automation`, esta prueba y este reporte. `.gitignore` ya aparecía modificado antes de comenzar esta fase; se conservó sin cambios.

## Cómo validar manualmente

1. Levanta los tres servicios con sus puertos configurados habituales.
2. En la aplicación, conecta Gmail, elige un correo y marca sus adjuntos.
3. Extrae los datos y abre **Revisar DUCA T**.
4. Edita un campo y cierra con la X, clic en el fondo o **Cerrar revisión**; debe aparecer **Hay cambios sin guardar**. Prueba **Seguir editando**, luego **Guardar y cerrar** y **Salir sin guardar**. Al volver a abrir, debe mostrarse `parsedData` guardado.
5. Aprueba las discrepancias y completa los campos que se indiquen. Pulsa **Autenticar en SIECA y enviar**; el panel debe mostrar estado, paso y pausa, y permitir continuar o cancelar cuando corresponda.
6. Para la pantalla de fixtures, abre `/dev/preview` y carga, uno por uno, `contrato/fixtures/embarque_1.json`, `embarque_2.json` y `embarque_3.json`.
