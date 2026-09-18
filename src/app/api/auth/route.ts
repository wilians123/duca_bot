import { mkdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { chromium } from "playwright";
import { waitForManualLogin } from "@/lib/sieca-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 900;

const tmpDir = path.join(process.cwd(), "tmp");
const storageStatePath = path.join(tmpDir, "storageState.json");
const ducaLoginUrl =
  process.env.SIECA_DUCA_LOGIN_URL || "https://www.duca.sieca.int/PortalCapturaDUCA/Account/Login";

export async function POST() {
  let browser;

  try {
    await mkdir(tmpDir, { recursive: true });

    browser = await chromium.launch({
      headless: false,
      slowMo: 80,
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(ducaLoginUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await waitForManualLogin(page);
    await context.storageState({ path: storageStatePath });
    await browser.close();

    return NextResponse.json({
      ok: true,
      message: "Login detectado. Estado de sesion guardado en /tmp/storageState.json.",
    });
  } catch (error) {
    if (browser) {
      await browser.close().catch(() => undefined);
    }

    return NextResponse.json(
      {
        ok: false,
        message: "No se pudo completar la autenticacion.",
        error: error instanceof Error ? error.message : "Error desconocido.",
      },
      { status: 500 },
    );
  }
}
