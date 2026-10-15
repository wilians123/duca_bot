import { NextResponse } from "next/server";

export const automationUrl = (suffix: string) =>
  `${(process.env.AUTOMATION_URL || "http://127.0.0.1:8002").replace(/\/$/, "")}${suffix}`;

export function unavailableResponse() {
  return NextResponse.json(
    {
      ok: false,
      error: {
        codigo: "AUTOMATION_UNAVAILABLE_ERR",
        mensaje: "La automatización no está disponible.",
      },
    },
    { status: 503 },
  );
}

export async function relayResponse(response: Response) {
  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") || "application/json" },
  });
}
