import { automationUrl, relayResponse, unavailableResponse } from "../../proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> | { id: string } };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    return await relayResponse(await fetch(automationUrl(`/automation/${encodeURIComponent(id)}/cancel`), { method: "POST" }));
  } catch {
    return unavailableResponse();
  }
}
