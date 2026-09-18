"use client";

import { ChangeEvent, useState, useEffect } from "react";
import { TextField } from "./duca-t/fields/TextField";
import { SelectField } from "./duca-t/fields/SelectField";
import { TextareaField } from "./duca-t/fields/TextareaField";

export type DucaDataState = any;

interface DucaPreviewFormProps {
  data: DucaDataState;
  onChange: (newData: DucaDataState) => void;
  hasDiscrepancies: boolean;
  discrepancyDetails: string | null;
}

export function DucaPreviewForm({ data, onChange, hasDiscrepancies, discrepancyDetails }: DucaPreviewFormProps) {
  const [localData, setLocalData] = useState<DucaDataState>(data);

  // Sync if parent data changes completely
  useEffect(() => {
    setLocalData(data);
  }, [data]);

  if (!localData) return null;

  const handleChange = (path: string[], value: any) => {
    const newData = { ...localData };
    let current = newData;
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) current[path[i]] = {};
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    setLocalData(newData);
  };

  const handleArrayChange = (step: string, arrayName: string, index: number, field: string, value: any) => {
    const newData = { ...localData };
    if (!newData[step][arrayName]) return;
    newData[step][arrayName][index][field] = value;
    setLocalData(newData);
  };

  const handleSave = () => {
    onChange(localData);
    alert("Cambios guardados correctamente en el JSON original.");
  };

  return (
    <div className="flex flex-col gap-6">
      {hasDiscrepancies && (
        <div className="rounded-md bg-error-container p-4 border border-error">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-on-error-container">
                Discrepancia de datos detectada entre correo y adjuntos
              </h3>
              <div className="mt-2 text-sm text-on-error-container/80">
                <p>{discrepancyDetails}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-12">
        
        {/* PASO 1 */}
        <div className="flex flex-col gap-6 border-b border-outline-variant pb-8">
          <h2 className="text-title-lg font-title-lg text-on-surface font-semibold">Paso 1: Ruta</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextField label="País de procedencia" value={localData.paso1?.paisInicio} onChange={v => handleChange(["paso1", "paisInicio"], v)} />
            <TextField label="Aduana de inicio" value={localData.paso1?.aduanaSalida} onChange={v => handleChange(["paso1", "aduanaSalida"], v)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextField label="País de destino" value={localData.paso1?.paisDestino} onChange={v => handleChange(["paso1", "paisDestino"], v)} />
            <TextField label="Aduana de destino" value={localData.paso1?.aduanaEntrada} onChange={v => handleChange(["paso1", "aduanaEntrada"], v)} />
          </div>
          <TextareaField label="Observaciones" value={localData.paso1?.observaciones} onChange={v => handleChange(["paso1", "observaciones"], v)} />
          <TextField label="Número de Declaración" value={localData.paso1?.numeroDeclaracion} onChange={v => handleChange(["paso1", "numeroDeclaracion"], v)} />
        </div>

        {/* PASO 2 y 3 */}
        <div className="flex flex-col md:flex-row gap-8 border-b border-outline-variant pb-8">
          <div className="flex-1 flex flex-col gap-6">
            <h2 className="text-title-lg font-title-lg text-on-surface font-semibold">Paso 2: Exportador</h2>
            <TextField label="Nombre o razón social" value={localData.paso2?.nombre} onChange={v => handleChange(["paso2", "nombre"], v)} />
            <TextField label="Número de documento de identificación (NIT)" value={localData.paso2?.nit} onChange={v => handleChange(["paso2", "nit"], v)} />
            <TextField label="Tipo de documento de identificación" value={localData.paso2?.tipoDocumento} onChange={v => handleChange(["paso2", "tipoDocumento"], v)} />
            <TextField label="País de emisión" value={localData.paso2?.pais} onChange={v => handleChange(["paso2", "pais"], v)} />
          </div>
          <div className="flex-1 flex flex-col gap-6">
            <h2 className="text-title-lg font-title-lg text-on-surface font-semibold">Paso 3: Importador</h2>
            <TextField label="Nombre o razón social" value={localData.paso3?.nombre} onChange={v => handleChange(["paso3", "nombre"], v)} />
            <TextField label="Número de documento de identificación (NIT)" value={localData.paso3?.nit} onChange={v => handleChange(["paso3", "nit"], v)} />
            <TextField label="Tipo de documento de identificación" value={localData.paso3?.tipoDocumento} onChange={v => handleChange(["paso3", "tipoDocumento"], v)} />
            <TextField label="País de emisión" value={localData.paso3?.pais} onChange={v => handleChange(["paso3", "pais"], v)} />
          </div>
        </div>

        {/* PASO 4 */}
        <div className="flex flex-col gap-6 border-b border-outline-variant pb-8">
          <h2 className="text-title-lg font-title-lg text-on-surface font-semibold">Paso 4: Tránsito</h2>
          <TextField label="Aduana de Paso" value={localData.paso4?.aduanaPaso} onChange={v => handleChange(["paso4", "aduanaPaso"], v)} />
        </div>

        {/* PASO 5 y 6 */}
        <div className="flex flex-col md:flex-row gap-8 border-b border-outline-variant pb-8">
          <div className="flex-1 flex flex-col gap-6">
            <h2 className="text-title-lg font-title-lg text-on-surface font-semibold">Paso 5: Transporte</h2>
            <TextField label="Código Transportista" value={localData.paso5?.transportista?.codigo} onChange={v => handleChange(["paso5", "transportista", "codigo"], v)} />
            <TextField label="Placa Vehículo" value={localData.paso5?.vehiculo?.placa} onChange={v => handleChange(["paso5", "vehiculo", "placa"], v)} />
          </div>
          <div className="flex-1 flex flex-col gap-6">
            <h2 className="text-title-lg font-title-lg text-on-surface font-semibold">Paso 6: Conductor</h2>
            <TextField label="Documento" value={localData.paso6?.documento} onChange={v => handleChange(["paso6", "documento"], v)} />
            <TextField label="Tipo Documento" value={localData.paso6?.tipoDocumento} onChange={v => handleChange(["paso6", "tipoDocumento"], v)} />
          </div>
        </div>

        {/* PASO 7 */}
        <div className="flex flex-col gap-6 border-b border-outline-variant pb-8">
          <h2 className="text-title-lg font-title-lg text-on-surface font-semibold">Paso 7: Mercancías y Gastos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TextField label="Transporte" value={localData.paso7?.gastos?.transporte?.toString()} onChange={v => handleChange(["paso7", "gastos", "transporte"], v)} />
            <TextField label="Seguro" value={localData.paso7?.gastos?.seguro?.toString()} onChange={v => handleChange(["paso7", "gastos", "seguro"], v)} />
            <TextField label="Otros Gastos" value={localData.paso7?.gastos?.otros?.toString()} onChange={v => handleChange(["paso7", "gastos", "otros"], v)} />
          </div>
          
          {localData.paso7?.mercancias?.map((merc: any, i: number) => (
            <div key={i} className="flex flex-col gap-6 bg-surface-container-low p-4 rounded-lg">
              <h3 className="text-title-md font-title-md text-on-surface font-semibold">Mercancía {i + 1}</h3>
              <TextField label="Descripción" value={merc.descripcion} onChange={v => handleArrayChange("paso7", "mercancias", i, "descripcion", v)} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <TextField label="Partida Arancelaria" value={merc.numeroMercancia} onChange={v => handleArrayChange("paso7", "mercancias", i, "numeroMercancia", v)} />
                <TextField label="Bultos" value={merc.bultos?.toString()} onChange={v => handleArrayChange("paso7", "mercancias", i, "bultos", v)} />
                <TextField label="Peso Bruto" value={merc.pesoBruto?.toString()} onChange={v => handleArrayChange("paso7", "mercancias", i, "pesoBruto", v)} />
                <TextField label="Valor" value={merc.valor?.toString()} onChange={v => handleArrayChange("paso7", "mercancias", i, "valor", v)} />
              </div>
            </div>
          ))}
        </div>

        {/* PASO 8 */}
        <div className="flex flex-col gap-6 border-b border-outline-variant pb-8">
          <h2 className="text-title-lg font-title-lg text-on-surface font-semibold">Paso 8: Documentos Adjuntos</h2>
          {["cartaporte", "facturas", "manifiestos", "MBL", "HBL"].map((docType) => (
            localData.paso8?.[docType]?.length > 0 && (
              <div key={docType} className="flex flex-col gap-4">
                <h3 className="text-title-md font-title-md text-on-surface capitalize font-semibold">{docType}</h3>
                <div className="flex flex-col gap-4">
                  {localData.paso8[docType].map((doc: any, i: number) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex-1">
                        <TextField label="Nombre Documento" value={doc.nombreArchivo || doc.nombreDocumento} onChange={v => handleArrayChange("paso8", docType, i, "nombreArchivo", v)} />
                      </div>
                      <div className="flex-1">
                        <TextField label="Tipo Documento" value={doc.tipoArchivo || doc.tipoDocumento} onChange={v => handleArrayChange("paso8", docType, i, "tipoArchivo", v)} />
                      </div>
                      <div className="flex-1">
                        <TextField label="No. de Documento" value={doc.numeroDocumento} onChange={v => handleArrayChange("paso8", docType, i, "numeroDocumento", v)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>

        {/* PASO 9 */}
        <div className="flex flex-col gap-6 pb-8">
          <h2 className="text-title-lg font-title-lg text-on-surface font-semibold">Paso 9: Equipamiento y Transporte</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextField label="Equipamiento" value={localData.paso9?.equipamiento} onChange={v => handleChange(["paso9", "equipamiento"], v)} />
            <TextField label="Tipo de carga" value={localData.paso9?.tipoCarga} onChange={v => handleChange(["paso9", "tipoCarga"], v)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextField label="Identificación del remolque (Chasis)" value={localData.paso9?.remolque?.chasis} onChange={v => handleChange(["paso9", "remolque", "chasis"], v)} />
            <TextField label="Nacionalidad del remolque" value={localData.paso9?.remolque?.nacionalidad} onChange={v => handleChange(["paso9", "remolque", "nacionalidad"], v)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TextField label="Número de contenedor" value={localData.paso9?.contenedor?.numero} onChange={v => handleChange(["paso9", "contenedor", "numero"], v)} />
            <TextField label="Tipo contenedor" value={localData.paso9?.contenedor?.tipo} onChange={v => handleChange(["paso9", "contenedor", "tipo"], v)} />
            <TextField label="Tamaño contenedor" value={localData.paso9?.contenedor?.tamano} onChange={v => handleChange(["paso9", "contenedor", "tamano"], v)} />
          </div>
          <TextField label="Dispositivo de seguridad (Marchamo)" value={localData.paso9?.marchamo} onChange={v => handleChange(["paso9", "marchamo"], v)} />
        </div>

      </div>

      <div className="mt-6 flex justify-end">
        <button 
          onClick={handleSave}
          className="h-10 rounded-full bg-slate-900 px-6 text-sm font-semibold text-white hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center">
          Guardar cambios
        </button>
      </div>

    </div>
  );
}
