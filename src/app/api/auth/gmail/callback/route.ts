import { google } from "googleapis";
import { NextResponse } from "next/server";
import {
  consumeOAuthState,
  getGmailConnection,
  reserveGmailAddress,
  saveGmailConnection,
} from "@/lib/gmail-user";

function dashboardRedirect(request: Request, result: string) {
  const destination = new URL("/dashboard", request.url);
  destination.searchParams.set("gmail", result);
  return NextResponse.redirect(destination);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state") || "";
  const uid = consumeOAuthState(state);
  if (!uid) return dashboardRedirect(request, "invalid-state");
  if (url.searchParams.has("error")) return dashboardRedirect(request, "cancelled");

  const code = url.searchParams.get("code");
  if (!code) return dashboardRedirect(request, "error");

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI,
    );
    const existing = getGmailConnection(uid);
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.refresh_token && !existing) {
      return dashboardRedirect(request, "retry-consent");
    }
    oauth2Client.setCredentials({ ...existing?.tokens, ...tokens });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: "me" });
    const email = profile.data.emailAddress?.trim().toLowerCase();
    if (!email) return dashboardRedirect(request, "error");

    if (existing && existing.email !== email) {
      return dashboardRedirect(request, "already-linked");
    }

    reserveGmailAddress(uid, email);
    saveGmailConnection({
      uid,
      email,
      tokens: { ...existing?.tokens, ...tokens },
      linkedAt: existing?.linkedAt || new Date().toISOString(),
    });
    return dashboardRedirect(request, "connected");
  } catch (error) {
    console.error("Error al autenticar con Gmail:", error);
    if (
      error instanceof Error &&
      error.message === "Esta cuenta de Gmail ya está vinculada a otro usuario."
    ) {
      return dashboardRedirect(request, "already-linked");
    }
    return dashboardRedirect(request, "error");
  }
}
