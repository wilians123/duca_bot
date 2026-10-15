import { NextResponse } from "next/server";
import { authenticateFirebaseRequest, listGmailConnections } from "@/lib/gmail-user";

export async function GET(request: Request) {
  const auth = await authenticateFirebaseRequest(request);
  if (!auth.identity) {
    return NextResponse.json(
      { error: auth.error?.message },
      { status: auth.error?.status || 401 },
    );
  }
  if (auth.identity.role !== "admin") {
    return NextResponse.json(
      { error: "Solo un administrador puede consultar estas conexiones." },
      { status: 403 },
    );
  }

  return NextResponse.json({ connections: listGmailConnections() });
}
