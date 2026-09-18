import { google } from "googleapis";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI,
);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "No se encontró el código de autorización" },
      { status: 400 },
    );
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    // Guardamos los tokens en un archivo temporal seguro para el MVP
    const tokenPath = path.join(process.cwd(), "tmp", "gmail_tokens.json");
    fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));

    // Redirige de vuelta al panel principal de tu app
    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("Error detallado en callback de Gmail:", error); // <-- Usamos la variable
    return NextResponse.json(
      { error: "Error al autenticar con Gmail" },
      { status: 500 },
    );
  }
}
