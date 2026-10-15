import { automationUrl, relayResponse, unavailableResponse } from "../proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> | { id: string } };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    return await relayResponse(await fetch(automationUrl(`/automation/${encodeURIComponent(id)}`), { cache: "no-store" }));
  } catch {
    return unavailableResponse();
  }
}
