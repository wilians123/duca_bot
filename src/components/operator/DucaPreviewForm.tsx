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
  paisInicio?: DucaScalar;
  aduanaSalida?: DucaScalar;
  paisDestino?: DucaScalar;
  aduanaEntrada?: DucaScalar;
  observaciones?: DucaScalar;
  nombre?: DucaScalar;
  nit?: DucaScalar;
  tipoDocumento?: DucaScalar;
  pais?: DucaScalar;
  aduanaPaso?: DucaScalar;
  transportista?: DucaObject & { codigo?: DucaScalar };
  vehiculo?: DucaObject & { placa?: DucaScalar };
  documento?: DucaScalar;
  gastos?: DucaObject & {
    transporte?: DucaScalar;
    seguro?: DucaScalar;
    otros?: DucaScalar;
  };
  mercancias?: DucaItem[];
  equipamiento?: DucaScalar;
  tipoCarga?: DucaScalar;
  remolque?: DucaObject & {
    chasis?: DucaScalar;
    nacionalidad?: DucaScalar;
  };
  contenedor?: DucaObject & {
    numero?: DucaScalar;
    tipo?: DucaScalar;
    tamano?: DucaScalar;
  };
  marchamo?: DucaScalar;
}

interface DucaItem extends DucaObject {
  descripcion?: DucaScalar;
  numeroMercancia?: DucaScalar;
  bultos?: DucaScalar;
  pesoBruto?: DucaScalar;
  valor?: DucaScalar;
}

interface DucaDocument extends DucaObject {
  nombreArchivo?: DucaScalar;
  nombreDocumento?: DucaScalar;
  tipoArchivo?: DucaScalar;
  tipoDocumento?: DucaScalar;
  numeroDocumento?: DucaScalar;
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
    setLocalData(newData);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    onChange(localData);
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
                value={localData.paso1?.paisInicio}
                onChange={(v) => handleChange(["paso1", "paisInicio"], v)}
              />
              <TextField
                label="Aduana de inicio"
                value={localData.paso1?.aduanaSalida}
                onChange={(v) => handleChange(["paso1", "aduanaSalida"], v)}
              />
              <TextField
                label="País de destino"
                value={localData.paso1?.paisDestino}
                onChange={(v) => handleChange(["paso1", "paisDestino"], v)}
              />
              <TextField
                label="Aduana de destino"
                value={localData.paso1?.aduanaEntrada}
                onChange={(v) => handleChange(["paso1", "aduanaEntrada"], v)}
              />
              <div className="span-all">
                <TextareaField
                  label="Observaciones"
                  value={localData.paso1?.observaciones}
                  onChange={(v) => handleChange(["paso1", "observaciones"], v)}
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
                  label="Nombre o razón social"
                  value={localData.paso2?.nombre}
                  onChange={(v) => handleChange(["paso2", "nombre"], v)}
                />
              </div>
              <TextField
                label="Número de documento de identificación (NIT)"
                value={localData.paso2?.nit}
                onChange={(v) => handleChange(["paso2", "nit"], v)}
              />
              <TextField
                label="Tipo de documento de identificación"
                value={localData.paso2?.tipoDocumento}
                onChange={(v) => handleChange(["paso2", "tipoDocumento"], v)}
              />
              <div className="span-all">
                <TextField
                  label="País de emisión"
                  value={localData.paso2?.pais}
                  onChange={(v) => handleChange(["paso2", "pais"], v)}
                />
              </div>
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
                  label="Nombre o razón social"
                  value={localData.paso3?.nombre}
                  onChange={(v) => handleChange(["paso3", "nombre"], v)}
                />
              </div>
              <TextField
                label="Número de documento de identificación (NIT)"
                value={localData.paso3?.nit}
                onChange={(v) => handleChange(["paso3", "nit"], v)}
              />
              <TextField
                label="Tipo de documento de identificación"
                value={localData.paso3?.tipoDocumento}
                onChange={(v) => handleChange(["paso3", "tipoDocumento"], v)}
              />
              <div className="span-all">
                <TextField
                  label="País de emisión"
                  value={localData.paso3?.pais}
                  onChange={(v) => handleChange(["paso3", "pais"], v)}
                />
              </div>
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
                label="Aduana de Paso"
                value={localData.paso4?.aduanaPaso}
                onChange={(v) => handleChange(["paso4", "aduanaPaso"], v)}
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
                label="Código Transportista"
                value={localData.paso5?.transportista?.codigo}
                onChange={(v) => handleChange(["paso5", "transportista", "codigo"], v)}
              />
              <TextField
                label="Placa Vehículo"
                value={localData.paso5?.vehiculo?.placa}
                onChange={(v) => handleChange(["paso5", "vehiculo", "placa"], v)}
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
                label="Documento"
                value={localData.paso6?.documento}
                onChange={(v) => handleChange(["paso6", "documento"], v)}
              />
              <TextField
                label="Tipo Documento"
                value={localData.paso6?.tipoDocumento}
                onChange={(v) => handleChange(["paso6", "tipoDocumento"], v)}
              />
            </div>
          </section>

          {/* PASO 7: Mercancías y Gastos */}
          <section className="duca-step" id="duca-preview-paso-7">
            <header>
              <span className="flow-num">7</span>
              <h3>Paso 7: Mercancías y Gastos</h3>
            </header>
            <div className="grid">
              <div className="subcard">
                <h4>Gastos</h4>
                <div className="grid cols-3" style={{ padding: 0 }}>
                  <TextField
                    label="Transporte"
                    value={localData.paso7?.gastos?.transporte}
                    onChange={(v) => handleChange(["paso7", "gastos", "transporte"], v)}
                  />
                  <TextField
                    label="Seguro"
                    value={localData.paso7?.gastos?.seguro}
                    onChange={(v) => handleChange(["paso7", "gastos", "seguro"], v)}
                  />
                  <TextField
                    label="Otros Gastos"
                    value={localData.paso7?.gastos?.otros}
                    onChange={(v) => handleChange(["paso7", "gastos", "otros"], v)}
                  />
                </div>
              </div>

              {localData.paso7?.mercancias?.map((merc, i: number) => (
                <div key={i} className="subcard">
                  <h4>Mercancía {i + 1}</h4>
                  <TextField
                    label="Descripción"
                    value={merc.descripcion}
                    onChange={(v) =>
                      handleArrayChange("paso7", "mercancias", i, "descripcion", v)
                    }
                  />
                  <div className="grid cols-4" style={{ padding: 0 }}>
                    <TextField
                      label="Partida Arancelaria"
                      value={merc.numeroMercancia}
                      onChange={(v) =>
                        handleArrayChange("paso7", "mercancias", i, "numeroMercancia", v)
                      }
                    />
                    <TextField
                      label="Bultos"
                      value={merc.bultos?.toString()}
                      onChange={(v) =>
                        handleArrayChange("paso7", "mercancias", i, "bultos", v)
                      }
                    />
                    <TextField
                      label="Peso Bruto"
                      value={merc.pesoBruto?.toString()}
                      onChange={(v) =>
                        handleArrayChange("paso7", "mercancias", i, "pesoBruto", v)
                      }
                    />
                    <TextField
                      label="Valor"
                      value={merc.valor?.toString()}
                      onChange={(v) =>
                        handleArrayChange("paso7", "mercancias", i, "valor", v)
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
              {["cartaporte", "facturas", "manifiestos", "MBL", "HBL"].map((docType) => {
                const docs = localData.paso8?.[docType];
                if (!docs || docs.length === 0) return null;
                return (
                  <div key={docType} className="subcard">
                    <h4 style={{ textTransform: "capitalize" }}>{docType}</h4>
                    {docs.map((doc, i: number) => (
                      <div key={i} className="grid cols-3" style={{ padding: 0 }}>
                        <TextField
                          label="Nombre Documento"
                          value={doc.nombreArchivo || doc.nombreDocumento}
                          onChange={(v) =>
                            handleArrayChange("paso8", docType, i, "nombreArchivo", v)
                          }
                        />
                        <TextField
                          label="Tipo Documento"
                          value={doc.tipoArchivo || doc.tipoDocumento}
                          onChange={(v) =>
                            handleArrayChange("paso8", docType, i, "tipoArchivo", v)
                          }
                        />
                        <TextField
                          label="No. de Documento"
                          value={doc.numeroDocumento}
                          onChange={(v) =>
                            handleArrayChange("paso8", docType, i, "numeroDocumento", v)
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
                label="Equipamiento"
                value={localData.paso9?.equipamiento}
                onChange={(v) => handleChange(["paso9", "equipamiento"], v)}
              />
              <TextField
                label="Tipo de carga"
                value={localData.paso9?.tipoCarga}
                onChange={(v) => handleChange(["paso9", "tipoCarga"], v)}
              />
              <TextField
                label="Identificación del remolque (Chasis)"
                value={localData.paso9?.remolque?.chasis}
                onChange={(v) => handleChange(["paso9", "remolque", "chasis"], v)}
              />
              <TextField
                label="Nacionalidad del remolque"
                value={localData.paso9?.remolque?.nacionalidad}
                onChange={(v) => handleChange(["paso9", "remolque", "nacionalidad"], v)}
              />
              <div className="span-all grid cols-3" style={{ padding: 0 }}>
                <TextField
                  label="Número de contenedor"
                  value={localData.paso9?.contenedor?.numero}
                  onChange={(v) => handleChange(["paso9", "contenedor", "numero"], v)}
                />
                <TextField
                  label="Tipo contenedor"
                  value={localData.paso9?.contenedor?.tipo}
                  onChange={(v) => handleChange(["paso9", "contenedor", "tipo"], v)}
                />
                <TextField
                  label="Tamaño contenedor"
                  value={localData.paso9?.contenedor?.tamano}
                  onChange={(v) => handleChange(["paso9", "contenedor", "tamano"], v)}
                />
              </div>
              <div className="span-all">
                <TextField
                  label="Dispositivo de seguridad (Marchamo)"
                  value={localData.paso9?.marchamo}
                  onChange={(v) => handleChange(["paso9", "marchamo"], v)}
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
