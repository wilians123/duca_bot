import { google } from "googleapis";
import { NextResponse } from "next/server";
import { authenticateFirebaseRequest, createOAuthState, getGmailConnection } from "@/lib/gmail-user";

export async function POST(request: Request) {
  const auth = await authenticateFirebaseRequest(request);
  if (!auth.identity) {
    return NextResponse.json({ error: auth.error?.message }, { status: auth.error?.status || 401 });
  }

  const linked = getGmailConnection(auth.identity.uid);
  if (linked) {
    return NextResponse.json({ error: "Este usuario ya tiene una cuenta de Gmail vinculada.", email: linked.email }, { status: 409 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI,
  );
  const state = createOAuthState(auth.identity.uid);
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "select_account consent",
    state,
    scope: ["https://www.googleapis.com/auth/gmail.readonly"],
  });

  return NextResponse.json({ url });
}

export async function GET(request: Request) {
  const auth = await authenticateFirebaseRequest(request);
  if (!auth.identity) {
    return NextResponse.json({ error: auth.error?.message }, { status: auth.error?.status || 401 });
  }
  const connection = getGmailConnection(auth.identity.uid);
  return NextResponse.json({ connected: Boolean(connection), email: connection?.email || null });
}
