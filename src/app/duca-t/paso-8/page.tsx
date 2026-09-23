"use client";

import { useState } from "react";
import { FormShell } from "@/components/duca-t/FormShell";
import { StepActions } from "@/components/duca-t/StepActions";
import { TextField } from "@/components/duca-t/fields/TextField";
import { useDucaFormStore } from "@/store/duca-form-store";
import type { DocumentoSoporte } from "@/types/duca";

type DocumentoCampos = {
  titulo: string;
  nombre: keyof DocumentoSoporte;
  tipo: keyof DocumentoSoporte;
  numero: keyof DocumentoSoporte;
};

const BLOQUES_DOCUMENTOS: DocumentoCampos[] = [
  {
    titulo: "Carta de porte",
    nombre: "NombreDocumentoPorte",
    tipo: "TipoDocumentoPorte",
    numero: "NumeroDocumentoPorte",
  },
  {
    titulo: "Facturas",
    nombre: "NombreDocumentoFactura",
    tipo: "TipoDocumentoFactura",
    numero: "NumeroDocumentoFactura",
  },
  {
    titulo: "Manifiestos",
    nombre: "NombreDocumentoManifiesto",
    tipo: "TipoDocumentoManifiesto",
    numero: "NumeroDocumentoManifiesto",
  },
  {
    titulo: "Otros",
    nombre: "NombreDocumentoBL",
    tipo: "TipoDocumentoManifiestoBL",
    numero: "NumeroDocumentoManifiestoBL",
  },
];

export default function Paso8DocumentosPage() {
  const documentos = useDucaFormStore((s) => s.documentos);
  const addDocumento = useDucaFormStore((s) => s.addDocumento);
  const updateDocumento = useDucaFormStore((s) => s.updateDocumento);
  const toggleDocumento = useDucaFormStore((s) => s.toggleDocumento);
  const removeDocumento = useDucaFormStore((s) => s.removeDocumento);
  const [filtro, setFiltro] = useState("");

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    nombreCampo: keyof DocumentoSoporte,
  ) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) =>
      addDocumento({
        id: `${file.name}-${file.size}-${Date.now()}`,
        incluido: true,
        [nombreCampo]: file.name,
      }),
    );
    e.target.value = "";
  };

  const matchesFilter = (doc: DocumentoSoporte, campos: DocumentoCampos) =>
    String(doc[campos.nombre] ?? "")
      .toLowerCase()
      .includes(filtro.toLowerCase());

  return (
    <FormShell currentStepId={8}>
      <div className="col-span-12 flex flex-col gap-6">
        <input
          className="border border-outline-variant rounded bg-white h-9 w-full md:w-64 text-body-sm px-2 focus:ring-1 focus:ring-primary focus:border-primary"
          placeholder="Filtrar por nombre..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />

        {BLOQUES_DOCUMENTOS.map((campos) => {
          const documentosDelBloque = documentos.filter(
            (doc) => doc[campos.nombre] !== undefined && matchesFilter(doc, campos),
          );

          return (
            <section key={campos.titulo}>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <h3 className="text-label-bold font-label-bold text-on-surface">{campos.titulo}</h3>
                <label className="text-button-text font-button-text text-secondary hover:underline cursor-pointer">
                  + Adjuntar documento
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileChange(e, campos.nombre)}
                  />
                </label>
              </div>

              <div className="overflow-x-auto border border-outline-variant rounded mt-4">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low">
                    <tr>
                      <th className="p-2 w-10 text-center border-r border-outline-variant text-body-sm">#</th>
                      <th className="p-2 border-r border-outline-variant text-body-sm">Documento</th>
                      <th className="p-2 border-r border-outline-variant text-body-sm">Tipo de documento</th>
                      <th className="p-2 border-r border-outline-variant text-body-sm">No. de documento</th>
                      <th className="p-2 w-24 text-center text-body-sm">Incluir</th>
                      <th className="p-2 w-16" />
                    </tr>
                  </thead>
                  <tbody>
                    {documentosDelBloque.map((doc, i) => (
                      <tr key={doc.id} className="border-t border-outline-variant">
                        <td className="p-2 text-center border-r border-outline-variant text-body-sm">{i + 1}</td>
                        <td className="p-2 border-r border-outline-variant">
                          <TextField
                            label="Documento"
                            value={String(doc[campos.nombre] ?? "")}
                            onChange={(v) => updateDocumento(doc.id, { [campos.nombre]: v })}
                          />
                        </td>
                        <td className="p-2 border-r border-outline-variant">
                          <TextField
                            label="Tipo de documento"
                            value={String(doc[campos.tipo] ?? "")}
                            onChange={(v) => updateDocumento(doc.id, { [campos.tipo]: v })}
                          />
                        </td>
                        <td className="p-2 border-r border-outline-variant">
                          <TextField
                            label="No. de documento"
                            value={String(doc[campos.numero] ?? "")}
                            onChange={(v) => updateDocumento(doc.id, { [campos.numero]: v })}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={doc.incluido}
                            onChange={() => toggleDocumento(doc.id)}
                            className="h-4 w-4 accent-primary"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeDocumento(doc.id)}
                            className="text-error text-body-sm hover:underline"
                          >
                            Quitar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {documentosDelBloque.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-on-surface-variant text-body-sm">
                          No hay documentos adjuntos.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}

        <div className="w-full border-t border-outline-variant my-6" />
        <StepActions stepId={8} />
      </div>
    </FormShell>
  );
}
