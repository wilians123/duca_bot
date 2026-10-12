// TEMPORAL: página aislada para validar fixtures; se eliminará en la Fase 5.
"use client";

import { ChangeEvent, useState } from "react";
import { notFound } from "next/navigation";
import {
  DucaDataState,
  DucaPreviewForm,
} from "@/components/operator/DucaPreviewForm";

interface PreviewFixture {
  hasDiscrepancies?: boolean;
  discrepancyDetails?: string | null;
  [key: string]: unknown;
}

export default function PreviewFixturesPage() {
  const [data, setData] = useState<DucaDataState | null>(null);
  const [hasDiscrepancies, setHasDiscrepancies] = useState(false);
  const [discrepancyDetails, setDiscrepancyDetails] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (process.env.NODE_ENV === "production") notFound();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fixture = JSON.parse(await file.text()) as PreviewFixture;
      setData(fixture as DucaDataState);
      setHasDiscrepancies(Boolean(fixture.hasDiscrepancies));
      setDiscrepancyDetails(
        typeof fixture.discrepancyDetails === "string"
          ? fixture.discrepancyDetails
          : null,
      );
      setError(null);
    } catch {
      setData(null);
      setError("No se pudo cargar el archivo JSON.");
    }
  };

  return (
    <main className="p-6">
      <h1>Previsualización de fixtures DUCA-T</h1>
      <label>
        Archivo JSON
        <input type="file" accept="application/json,.json" onChange={handleFileChange} />
      </label>
      {error && <p role="alert">{error}</p>}
      {data && (
        <DucaPreviewForm
          key={JSON.stringify(data)}
          data={data}
          onChange={setData}
          hasDiscrepancies={hasDiscrepancies}
          discrepancyDetails={discrepancyDetails}
        />
      )}
    </main>
  );
}
