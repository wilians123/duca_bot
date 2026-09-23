"use client";

import { useState } from "react";
import { TextField } from "../duca-t/fields/TextField";
import { TextareaField } from "../duca-t/fields/TextareaField";

export type DucaScalar = string | number | null | undefined;
export type DucaValue = DucaScalar | boolean | DucaObject | DucaObject[];

export interface DucaObject {
  [key: string]: DucaValue;
}

interface DucaStep extends DucaObject {
  PaisProcedencia?: DucaScalar;
  AduanaInicio?: DucaScalar;
  PaisDestino?: DucaScalar;
  AduanaDestino?: DucaScalar;
  Observaciones?: DucaScalar;
  NombreExportador?: DucaScalar;
  DomicilioExportador?: DucaScalar;
  TipoIdentificacionExportador?: DucaScalar;
  NumeroIdentificacionExportador?: DucaScalar;
  PaisExportador?: DucaScalar;
  NombreImportador?: DucaScalar;
  DomicilioImportador?: DucaScalar;
  TipoIdentificacionImportador?: DucaScalar;
  NumeroIdentificacionImportador?: DucaScalar;
  PaisImportador?: DucaScalar;
  AduanaPaso?: DucaScalar;
  CodigoTransportista?: DucaScalar;
  PlacaTransporte?: DucaScalar;
  LicenciaConductor?: DucaScalar;
  gastos?: DucaObject & {
    ValorFOB?: DucaScalar;
    GastosTransporte?: DucaScalar;
    GastosSeguro?: DucaScalar;
    OtrosGastos?: DucaScalar;
    ValorTotal?: DucaScalar;
  };
  mercancias?: DucaItem[];
  TipoEquipamiento?: DucaScalar;
  TipoCarga?: DucaScalar;
  PlacaChasis?: DucaScalar;
  MarchamoSat?: DucaScalar;
  TamañoContenedor?: DucaScalar;
  NumeroContenedor?: DucaScalar;
  PaisChasis?: DucaScalar;
}

interface DucaItem extends DucaObject {
  PartidaArancelaria?: DucaScalar;
  DescripcionMercancia?: DucaScalar;
  CantidadMercancia?: DucaScalar;
  ClaseMercancia?: DucaScalar;
  PaisMercancia?: DucaScalar;
  PesoMercancia?: DucaScalar;
}

interface DucaDocument extends DucaObject {
  NombreDocumentoPorte?: DucaScalar;
  TipoDocumentoPorte?: DucaScalar;
  NumeroDocumentoPorte?: DucaScalar;
  NombreDocumentoFactura?: DucaScalar;
  TipoDocumentoFactura?: DucaScalar;
  NumeroDocumentoFactura?: DucaScalar;
  NombreDocumentoManifiesto?: DucaScalar;
  TipoDocumentoManifiesto?: DucaScalar;
  NumeroDocumentoManifiesto?: DucaScalar;
  NombreDocumentoBL?: DucaScalar;
  TipoDocumentoManifiestoBL?: DucaScalar;
  NumeroDocumentoManifiestoBL?: DucaScalar;
}

export interface DucaDataState extends DucaObject {
  paso1?: DucaStep;
  paso2?: DucaStep;
  paso3?: DucaStep;
  paso4?: DucaStep;
  paso5?: DucaStep;
  paso6?: DucaStep;
  paso7?: DucaStep;
  paso8?: Record<string, DucaDocument[]>;
  paso9?: DucaStep;
}

interface DucaPreviewFormProps {
  data: DucaDataState;
  onChange: (newData: DucaDataState) => void;
  hasDiscrepancies: boolean;
  discrepancyDetails: string | null;
}

function updatePaso7Total(data: DucaDataState) {
  const paso7 = data.paso7;
  if (!paso7) return;

  const gastos = paso7.gastos;
  const ValorTotal =
    (Number(gastos?.ValorFOB) || 0) +
    (Number(gastos?.GastosTransporte) || 0) +
    (Number(gastos?.GastosSeguro) || 0) +
    (Number(gastos?.OtrosGastos) || 0);

  paso7.gastos = { ...(gastos ?? {}), ValorTotal };
}

const STEP_TITLES = [
  "Ruta",
  "Exportador",
  "Importador",
  "Tránsito",
  "Transporte",
  "Conductor",
  "Mercancías y Gastos",
  "Documentos Adjuntos",
  "Equipamiento y Transporte",
];

const DOCUMENT_BLOCKS = [
  {
    key: "porte",
    title: "Carta de porte",
    nombre: "NombreDocumentoPorte",
    tipo: "TipoDocumentoPorte",
    numero: "NumeroDocumentoPorte",
  },
  {
    key: "facturas",
    title: "Facturas",
    nombre: "NombreDocumentoFactura",
    tipo: "TipoDocumentoFactura",
    numero: "NumeroDocumentoFactura",
  },
  {
    key: "manifiestos",
    title: "Manifiestos",
    nombre: "NombreDocumentoManifiesto",
    tipo: "TipoDocumentoManifiesto",
    numero: "NumeroDocumentoManifiesto",
  },
  {
    key: "otros",
    title: "Otros",
    nombre: "NombreDocumentoBL",
    tipo: "TipoDocumentoManifiestoBL",
    numero: "NumeroDocumentoManifiestoBL",
  },
] as const;

function WarnIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 flex-none mt-0.5">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function DucaPreviewForm({
  data,
  onChange,
  hasDiscrepancies,
  discrepancyDetails,
}: DucaPreviewFormProps) {
  const [localData, setLocalData] = useState<DucaDataState>(data);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  if (!localData) return null;

  const valorTotalPaso7 =
    (Number(localData.paso7?.gastos?.ValorFOB) || 0) +
    (Number(localData.paso7?.gastos?.GastosTransporte) || 0) +
    (Number(localData.paso7?.gastos?.GastosSeguro) || 0) +
    (Number(localData.paso7?.gastos?.OtrosGastos) || 0);

  const handleChange = (path: string[], value: DucaScalar) => {
    const newData = structuredClone(localData);
    let current: DucaObject = newData;
    for (let i = 0; i < path.length - 1; i++) {
      const next = current[path[i]];
      if (!next || typeof next !== "object" || Array.isArray(next)) {
        current[path[i]] = {};
      }
      current = current[path[i]] as DucaObject;
    }
    current[path[path.length - 1]] = value;
    updatePaso7Total(newData);
    setLocalData(newData);
    setHasUnsavedChanges(true);
  };

  const handleArrayChange = (
    step: string,
    arrayName: string,
    index: number,
    field: string,
    value: DucaScalar
  ) => {
    const newData = structuredClone(localData);
    const stepData = newData[step];
    if (!stepData || typeof stepData !== "object" || Array.isArray(stepData)) return;
    const items = stepData[arrayName];
    if (!Array.isArray(items)) return;
    const item = items[index];
    if (!item || typeof item !== "object" || Array.isArray(item)) return;
    item[field] = value;
    updatePaso7Total(newData);
    setLocalData(newData);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    const newData = structuredClone(localData);
    updatePaso7Total(newData);
    onChange(newData);
    setLocalData(newData);
    setHasUnsavedChanges(false);
  };

  const jumpToStep = (e: React.MouseEvent, stepNumber: number) => {
    e.preventDefault();
    setActiveStep(stepNumber);
    const el = document.getElementById(`duca-preview-paso-${stepNumber}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="preview-wrap">
      {/* Navegador lateral de pasos */}
      <nav className="step-index" aria-label="Pasos de la DUCA T">
        {STEP_TITLES.map((title, i) => {
          const stepNum = i + 1;
          const isCurrent = activeStep === stepNum;
          return (
            <a
              key={stepNum}
              href={`#duca-preview-paso-${stepNum}`}
              className={isCurrent ? "is-active" : ""}
              onClick={(e) => jumpToStep(e, stepNum)}
            >
              <i>{stepNum}</i>
              <span>{title}</span>
            </a>
          );
        })}
      </nav>

      {/* Contenedor con scroll de los 9 pasos */}
      <div style={{ minWidth: 0 }}>
        {/* Alerta de discrepancias si existe */}
        {hasDiscrepancies && (
          <div className="alert alert-warn mb-4">
            <WarnIcon />
            <div>
              <b className="block font-semibold">
                Un dato no coincide entre el correo y los adjuntos.
              </b>
              <p className="mt-0.5 text-xs sm:text-sm">
                {discrepancyDetails ||
                  "Verifica los valores extraídos antes de autenticar y enviar a SIECA."}
              </p>
            </div>
          </div>
        )}

        <div className="preview-scroll" id="duca-preview-scroll">
          {/* PASO 1: Ruta */}
          <section className="duca-step" id="duca-preview-paso-1">
            <header>
              <span className="flow-num">1</span>
              <h3>Paso 1: Ruta</h3>
            </header>
            <div className="grid cols-2">
              <TextField
                label="País de procedencia"
                value={localData.paso1?.PaisProcedencia}
                onChange={(v) => handleChange(["paso1", "PaisProcedencia"], v)}
              />
              <TextField
                label="Aduana de inicio"
                value={localData.paso1?.AduanaInicio}
                onChange={(v) => handleChange(["paso1", "AduanaInicio"], v)}
              />
              <TextField
                label="País de destino"
                value={localData.paso1?.PaisDestino}
                onChange={(v) => handleChange(["paso1", "PaisDestino"], v)}
              />
              <TextField
                label="Aduana de destino"
                value={localData.paso1?.AduanaDestino}
                onChange={(v) => handleChange(["paso1", "AduanaDestino"], v)}
              />
              <div className="span-all">
                <TextareaField
                  label="Observaciones (máx. 1500 caracteres)"
                  value={localData.paso1?.Observaciones}
                  onChange={(v) => handleChange(["paso1", "Observaciones"], v)}
                />
              </div>
            </div>
          </section>

          {/* PASO 2: Exportador */}
          <section className="duca-step" id="duca-preview-paso-2">
            <header>
              <span className="flow-num">2</span>
              <h3>Paso 2: Exportador</h3>
            </header>
            <div className="grid cols-2">
              <div className="span-all">
                <TextField
                  label="Nombre o razón social del exportador"
                  value={localData.paso2?.NombreExportador}
                  onChange={(v) => handleChange(["paso2", "NombreExportador"], v)}
                />
              </div>
              <TextField
                label="Domicilio fiscal del exportador"
                value={localData.paso2?.DomicilioExportador}
                onChange={(v) => handleChange(["paso2", "DomicilioExportador"], v)}
              />
              <TextField
                label="Tipo de documento de identificación"
                value={localData.paso2?.TipoIdentificacionExportador}
                onChange={(v) => handleChange(["paso2", "TipoIdentificacionExportador"], v)}
              />
              <div className="span-all">
                <TextField
                  label="País de emisión"
                  value={localData.paso2?.PaisExportador}
                  onChange={(v) => handleChange(["paso2", "PaisExportador"], v)}
                />
              </div>
              <TextField
                label="Número de documento de identificación"
                value={localData.paso2?.NumeroIdentificacionExportador}
                onChange={(v) => handleChange(["paso2", "NumeroIdentificacionExportador"], v)}
              />
            </div>
          </section>

          {/* PASO 3: Importador */}
          <section className="duca-step" id="duca-preview-paso-3">
            <header>
              <span className="flow-num">3</span>
              <h3>Paso 3: Importador</h3>
            </header>
            <div className="grid cols-2">
              <div className="span-all">
                <TextField
                  label="Nombre o razón social del importador"
                  value={localData.paso3?.NombreImportador}
                  onChange={(v) => handleChange(["paso3", "NombreImportador"], v)}
                />
              </div>
              <TextField
                label="Domicilio fiscal del importador"
                value={localData.paso3?.DomicilioImportador}
                onChange={(v) => handleChange(["paso3", "DomicilioImportador"], v)}
              />
              <TextField
                label="Tipo de documento de identificación"
                value={localData.paso3?.TipoIdentificacionImportador}
                onChange={(v) => handleChange(["paso3", "TipoIdentificacionImportador"], v)}
              />
              <div className="span-all">
                <TextField
                  label="País de emisión"
                  value={localData.paso3?.PaisImportador}
                  onChange={(v) => handleChange(["paso3", "PaisImportador"], v)}
                />
              </div>
              <TextField
                label="Número de documento de identificación"
                value={localData.paso3?.NumeroIdentificacionImportador}
                onChange={(v) => handleChange(["paso3", "NumeroIdentificacionImportador"], v)}
              />
            </div>
          </section>

          {/* PASO 4: Tránsito */}
          <section className="duca-step" id="duca-preview-paso-4">
            <header>
              <span className="flow-num">4</span>
              <h3>Paso 4: Tránsito</h3>
            </header>
            <div className="grid">
              <TextField
                label="Aduana de paso"
                value={localData.paso4?.AduanaPaso}
                onChange={(v) => handleChange(["paso4", "AduanaPaso"], v)}
              />
            </div>
          </section>

          {/* PASO 5: Transporte */}
          <section className="duca-step" id="duca-preview-paso-5">
            <header>
              <span className="flow-num">5</span>
              <h3>Paso 5: Transporte</h3>
            </header>
            <div className="grid cols-2">
              <TextField
                label="Código del transportista"
                value={localData.paso5?.CodigoTransportista}
                onChange={(v) => handleChange(["paso5", "CodigoTransportista"], v)}
              />
              <TextField
                label="Número de identificación de la unidad de transporte (No. de placa)"
                value={localData.paso5?.PlacaTransporte}
                onChange={(v) => handleChange(["paso5", "PlacaTransporte"], v)}
              />
            </div>
          </section>

          {/* PASO 6: Conductor */}
          <section className="duca-step" id="duca-preview-paso-6">
            <header>
              <span className="flow-num">6</span>
              <h3>Paso 6: Conductor</h3>
            </header>
            <div className="grid cols-2">
              <TextField
                label="Licencia"
                value={localData.paso6?.LicenciaConductor}
                onChange={(v) => handleChange(["paso6", "LicenciaConductor"], v)}
              />
            </div>
          </section>

          {/* PASO 7: Mercancías */}
          <section className="duca-step" id="duca-preview-paso-7">
            <header>
              <span className="flow-num">7</span>
              <h3>Paso 7: Mercancías</h3>
            </header>
            <div className="grid">
              <div className="subcard">
                <h4>Gastos</h4>
                <div className="grid cols-3" style={{ padding: 0 }}>
                  <TextField
                    label="Valor transacción"
                    value={localData.paso7?.gastos?.ValorFOB}
                    onChange={(v) => handleChange(["paso7", "gastos", "ValorFOB"], v)}
                  />
                  <TextField
                    label="Gastos de transporte"
                    value={localData.paso7?.gastos?.GastosTransporte}
                    onChange={(v) => handleChange(["paso7", "gastos", "GastosTransporte"], v)}
                  />
                  <TextField
                    label="Gastos de seguro"
                    value={localData.paso7?.gastos?.GastosSeguro}
                    onChange={(v) => handleChange(["paso7", "gastos", "GastosSeguro"], v)}
                  />
                  <TextField
                    label="Otros Gastos"
                    value={localData.paso7?.gastos?.OtrosGastos}
                    onChange={(v) => handleChange(["paso7", "gastos", "OtrosGastos"], v)}
                  />
                  <TextField
                    label="Valor en aduana total"
                    value={valorTotalPaso7}
                    onChange={() => {}}
                    disabled
                  />
                </div>
              </div>

              {localData.paso7?.mercancias?.map((merc, i: number) => (
                <div key={i} className="subcard">
                  <h4>Mercancía {i + 1}</h4>
                  <div className="grid cols-2" style={{ padding: 0 }}>
                    <TextField
                      label="Mercancía"
                      value={merc.PartidaArancelaria}
                      onChange={(v) =>
                        handleArrayChange("paso7", "mercancias", i, "PartidaArancelaria", v)
                      }
                    />
                    <TextField
                      label="Descripción"
                      value={merc.DescripcionMercancia}
                      onChange={(v) =>
                        handleArrayChange("paso7", "mercancias", i, "DescripcionMercancia", v)
                      }
                    />
                  </div>
                  <div className="grid cols-4" style={{ padding: 0 }}>
                    <TextField
                      label="Cantidad de bultos"
                      value={merc.CantidadMercancia?.toString()}
                      onChange={(v) =>
                        handleArrayChange("paso7", "mercancias", i, "CantidadMercancia", v)
                      }
                    />
                    <TextField
                      label="Clase de bultos"
                      value={merc.ClaseMercancia}
                      onChange={(v) =>
                        handleArrayChange("paso7", "mercancias", i, "ClaseMercancia", v)
                      }
                    />
                    <TextField
                      label="País de origen"
                      value={merc.PaisMercancia}
                      onChange={(v) =>
                        handleArrayChange("paso7", "mercancias", i, "PaisMercancia", v)
                      }
                    />
                    <TextField
                      label="Peso bruto (kg)"
                      value={merc.PesoMercancia?.toString()}
                      onChange={(v) =>
                        handleArrayChange("paso7", "mercancias", i, "PesoMercancia", v)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* PASO 8: Documentos Adjuntos */}
          <section className="duca-step" id="duca-preview-paso-8">
            <header>
              <span className="flow-num">8</span>
              <h3>Paso 8: Documentos Adjuntos</h3>
            </header>
            <div className="grid">
              {DOCUMENT_BLOCKS.map((documento) => {
                const docs = localData.paso8?.[documento.key];
                if (!docs || docs.length === 0) return null;
                return (
                  <div key={documento.key} className="subcard">
                    <h4>{documento.title}</h4>
                    {docs.map((doc, i: number) => (
                      <div key={i} className="grid cols-3" style={{ padding: 0 }}>
                        <TextField
                          label="Documento"
                          value={doc[documento.nombre]}
                          onChange={(v) =>
                            handleArrayChange("paso8", documento.key, i, documento.nombre, v)
                          }
                        />
                        <TextField
                          label="Tipo de documento"
                          value={doc[documento.tipo]}
                          onChange={(v) =>
                            handleArrayChange("paso8", documento.key, i, documento.tipo, v)
                          }
                        />
                        <TextField
                          label="No. de documento"
                          value={doc[documento.numero]}
                          onChange={(v) =>
                            handleArrayChange("paso8", documento.key, i, documento.numero, v)
                          }
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </section>

          {/* PASO 9: Equipamiento y Transporte */}
          <section className="duca-step" id="duca-preview-paso-9">
            <header>
              <span className="flow-num">9</span>
              <h3>Paso 9: Equipamiento y Transporte</h3>
            </header>
            <div className="grid cols-2">
              <TextField
                label="Equipamiento:"
                value={localData.paso9?.TipoEquipamiento}
                onChange={(v) => handleChange(["paso9", "TipoEquipamiento"], v)}
              />
              <TextField
                label="Tipo de carga:"
                value={localData.paso9?.TipoCarga}
                onChange={(v) => handleChange(["paso9", "TipoCarga"], v)}
              />
              <TextField
                label="Identificación del remolque o semiremolque:"
                value={localData.paso9?.PlacaChasis}
                onChange={(v) => handleChange(["paso9", "PlacaChasis"], v)}
              />
              <TextField
                label="Nacionalidad del remolque o semirremolque:"
                value={localData.paso9?.PaisChasis}
                onChange={(v) => handleChange(["paso9", "PaisChasis"], v)}
              />
              <div className="span-all grid cols-3" style={{ padding: 0 }}>
                <TextField
                  label="Número de identificación del contenedor:"
                  value={localData.paso9?.NumeroContenedor}
                  onChange={(v) => handleChange(["paso9", "NumeroContenedor"], v)}
                />
                <TextField
                  label="Tamaño del equipamiento:"
                  value={localData.paso9?.TamañoContenedor}
                  onChange={(v) => handleChange(["paso9", "TamañoContenedor"], v)}
                />
              </div>
              <div className="span-all">
                <TextField
                  label="Número de dispositivo de seguridad:"
                  value={localData.paso9?.MarchamoSat}
                  onChange={(v) => handleChange(["paso9", "MarchamoSat"], v)}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Barra inferior de acciones */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--line)]">
          <span className="text-xs sm:text-sm text-[var(--ink-3)] font-mono">
            {hasUnsavedChanges
              ? "● Hay cambios sin guardar"
              : "✓ Sin cambios pendientes"}
          </span>
          <button
            type="button"
            onClick={handleSave}
            className="btn btn-primary"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
