# Reporte Fase 1B · duca-bot

## (1) Resumen

Se alineó la categoría de carta de porte con `cartaporte`, se hizo explícita la visualización de categorías vacías y se cubrió el contrato de los tres fixtures con Vitest. La vista temporal de desarrollo permitió cargar los tres JSON y revisar los nueve pasos.

## (2) Archivos creados/modificados con el motivo de cada uno

- `src/components/operator/DucaPreviewForm.tsx`: clave `cartaporte`; normalización a arreglo para categorías ausentes/vacías y texto “Sin documentos”; los valores de documentos toleran objetos nulos. Los campos numéricos conservan su conversión/renderizado existente.
- `tests/contrato-fixtures.test.ts`: verifica para cada fixture las claves consumidas, las propiedades de documentos existentes y que las cuatro categorías del paso 8 sean arreglos.
- `src/app/dev/preview/page.tsx`: página temporal local para seleccionar JSON y renderizar `DucaPreviewForm`; oculta la ruta en producción. La clave de React fuerza el remontaje al seleccionar un fixture distinto. Está marcada para eliminarse en Fase 5.
- `REPORTE_FASE_1B.md`: auditoría previa, verificaciones, observaciones visuales y hallazgos.

No se modificaron `package.json`, la configuración, `src/app/page.tsx`, autenticación ni otros archivos fuera del alcance. `.gitignore` ya estaba modificado antes de iniciar; `Fase1B.md` y `contrato/` ya estaban sin seguimiento al inicio y se dejaron intactos.

## (3) Comandos ejecutados y su resultado

- Estado inicial: `git status --short --branch`; rama original `master` con `.gitignore` modificado y `Fase1B.md`/`contrato/` sin seguimiento.
- `npm run lint` antes y después — pasó en ambas ejecuciones.
- `npm test` inicial — Vitest no alcanzó a ejecutar tests: `EPERM` al renombrar su carpeta SSR en el directorio temporal del sandbox.
- `npx tsc --noEmit` antes y después — mismo resultado: errores de tipo preexistentes en `tests/duca-extraction.test.ts` (líneas 43, 53–55, 62–63, 80, 91 y 99; accesos a propiedades inferidas como `unknown`). No aparecieron errores de los archivos de esta fase.
- `npx vitest run tests/contrato-fixtures.test.ts` con `TEMP`/`TMP` dirigidos al `tmp` del proyecto — 3 tests pasaron.
- `npm test` con `TEMP`/`TMP` dirigidos al `tmp` del proyecto — 2 archivos, 11 tests pasaron.
- `npm run dev -- --port 3000` — puerto 3000 libre. El primer inicio sin elevación falló porque Turbopack no pudo canonicalizar la carpeta del proyecto (`Acceso denegado`); el inicio local elevado compiló la ruta y sirvió `/dev/preview` con HTTP 200. No se cambió el puerto.
- Navegador: se seleccionaron `embarque_1.json`, `embarque_2.json` y `embarque_3.json` desde la página local. La terminal de Next no mostró errores de compilación/render y respondió 200 para la ruta. El navegador integrado no expuso una vista de su consola JavaScript; por eso el chequeo directo de esa consola queda pendiente.
- `git diff --check` — sin errores de whitespace. El diff rastreado contra `master` incluye `.gitignore`, cambio que ya existía antes de la fase, y `DucaPreviewForm.tsx`; los archivos nuevos se verificaron mediante `git status`.

## (4) Estado de pruebas antes y después

| Verificación | Antes | Después |
| --- | --- | --- |
| `npm run lint` | Pasa | Pasa |
| `npm test` | `EPERM` en caché temporal; sin tests ejecutados | 11/11 pasan con `TEMP`/`TMP` en `tmp` del proyecto |
| Test de fixtures | No existía | 3/3 pasan |
| `npx tsc --noEmit` | Falla por errores `unknown` en `tests/duca-extraction.test.ts` | Mismos errores y líneas; sin errores nuevos |
| Visual de los tres fixtures | No verificado | Cargados y visibles; sin errores de servidor observados. Consola JS del navegador no accesible en la herramienta usada |

## (5) Decisiones tomadas y desviaciones

- Se creó la rama `codex/fase1b-ducabot`: la fase requería una rama pero no indicó nombre; se usó el prefijo habitual `codex/`. La escritura de refs Git requirió elevación porque `.git` está marcado como solo lectura por el sandbox.
- Para Vitest y Next se dirigieron las carpetas temporales al `tmp` del proyecto; así se evitó el error `EPERM` del directorio temporal asignado por el sandbox. No se cambió configuración ni puerto.
- La página dev usa el `ProtectedShell` global de la app y redirigió a `/login` al no estar inicializada la sesión en el navegador. Se pudo continuar con la sesión local que ya estaba activa; no se modificó la autenticación, prohibida por la fase.
- La auditoría contra contrato se escribió antes de las correcciones en esta sección T2.

### Auditoría T2 previa a las correcciones

Comparación de claves consumidas por el componente frente a `contrato/CONTRATO.md` y `contrato/fixtures/embarque_1..3.json`:

- Pasos 1–6: las claves de ruta, exportador, importador, tránsito, transporte y conductor consumidas por `DucaPreviewForm.tsx` coinciden con el contrato.
- Paso 7: `gastos.ValorFOB`, `GastosTransporte`, `GastosSeguro` y `OtrosGastos`, además de `mercancias[].PartidaArancelaria`, `DescripcionMercancia`, `CantidadMercancia`, `ClaseMercancia`, `PaisMercancia` y `PesoMercancia`, coinciden con el contrato. `ValorTotal` está descrito por el contrato, aunque el componente lo calcula; no se alteró ese cálculo, por prohibición explícita.
- Paso 8: los campos documentales de porte, factura, manifiesto y BL coinciden. Diferencia encontrada en la categoría: el componente usaba `DOCUMENT_BLOCKS.key = "porte"`; contrato y fixtures usan `paso8.cartaporte`.
- Paso 9: `TipoEquipamiento`, `TipoCarga`, `PlacaChasis`, `PaisChasis`, `NumeroContenedor`, `TamañoContenedor` y `MarchamoSat` coinciden con el contrato.
- Los tres fixtures contienen las claves consumidas; `paso8.cartaporte`, `facturas`, `manifiestos` y `otros` son arreglos. `cartaporte` está vacío en todos.

No se encontró otra diferencia de clave antes de editar.

## (6) Hallazgos fuera de alcance (no corregidos)

- `src/components/operator/DucaPreviewForm.tsx:99` y `:173`: calcula el total de aduana sumando los cuatro importes. El contrato, sección 13, dice que `ValorTotal` solo debe devolverse si la fuente lo rotula expresamente y que no debe sumarse. La tarea prohíbe cambiar el cálculo; propuesta: resolver esta divergencia del contrato/manual en una fase autorizada.
- `tests/duca-extraction.test.ts:43,53–55,62–63,80,91,99`: TypeScript reporta accesos a propiedades de `unknown`; eran fallos base. Propuesta: revisar los tipos de retorno/narrowing de esa suite en una tarea aparte.

## (7) Riesgos y pendientes para la Fase 2

- Resolver la diferencia entre el cálculo de `ValorTotal` en el frontend y la regla contractual/manual de no calcularlo.
- Corregir los errores de tipos preexistentes en `tests/duca-extraction.test.ts` en una fase que autorice ese archivo.
- Ejecutar el chequeo de consola del navegador en una sesión que exponga los logs del cliente; durante esta verificación no hubo errores de servidor, pero esa consola no se pudo consultar.

## (8) Cómo validar manualmente

1. Ejecutar `npm run dev -- --port 3000` en esta carpeta (si el puerto 3000 está ocupado, identificar el proceso del proyecto; no cambiar el puerto).
2. Iniciar sesión por el flujo normal de la aplicación y abrir `http://localhost:3000/dev/preview`.
3. Seleccionar individualmente `contrato/fixtures/embarque_1.json`, `embarque_2.json` y `embarque_3.json`.
4. Confirmar que aparecen los pasos 1–9, que campos `null` están vacíos/editables, que números/string numéricos se muestran, que paso 8 tiene cuatro categorías y que `cartaporte` muestra “Sin documentos”.
5. Para producción, comprobar que la ruta devuelve 404. La página es temporal y se eliminará en Fase 5.

## Observaciones para la Fase 3

`src/app/page.tsx` guarda la extracción en el estado `parsedData` y el formulario mantiene una copia local. `handleDataChange` actualiza `parsedData` únicamente cuando se pulsa “Guardar cambios”; si el operador cierra la revisión antes de guardar, los cambios locales se pierden al desmontar el formulario y no llegan al estado del padre. La acción “Autenticar en SIECA y enviar” invoca `authenticate`, que hace `POST /api/auth` sin enviar `parsedData`. Por lo tanto, en el código actual no se observó un envío del JSON a SIECA desde esa acción; ese flujo requiere definición en Fase 3.
