import { createHash, randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Credentials } from "google-auth-library";

export type FirebaseIdentity = { uid: string; email: string; role: string };
export type GmailTokenRecord = {
  uid: string;
  email: string;
  tokens: Credentials;
  linkedAt: string;
};

const tempDir = () => path.join(process.cwd(), "tmp", "gmail");
const userTokenPath = (uid: string) => path.join(tempDir(), `${uid}.json`);

export async function authenticateFirebaseRequest(request: Request): Promise<{
  identity?: FirebaseIdentity;
  error?: { message: string; status: number };
}> {
  const idToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!idToken || !apiKey || !projectId) {
    return { error: { message: "Se requiere una sesión activa.", status: 401 } };
  }

  try {
    const identityResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
        cache: "no-store",
      },
    );
    const identityPayload = (await identityResponse.json()) as {
      users?: { localId?: string; email?: string }[];
    };
    const firebaseUser = identityPayload.users?.[0];
    if (!identityResponse.ok || !firebaseUser?.localId) {
      return { error: { message: "La sesión de Firebase no es válida.", status: 401 } };
    }

    const profileResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${encodeURIComponent(firebaseUser.localId)}`,
      { headers: { Authorization: `Bearer ${idToken}` }, cache: "no-store" },
    );
    const profile = (await profileResponse.json()) as {
      fields?: {
        active?: { booleanValue?: boolean };
        role?: { stringValue?: string };
      };
    };
    if (!profileResponse.ok || profile.fields?.active?.booleanValue !== true) {
      return { error: { message: "La cuenta no existe o está desactivada.", status: 403 } };
    }

    return {
      identity: {
        uid: firebaseUser.localId,
        email: (firebaseUser.email || "").toLowerCase(),
        role: profile.fields?.role?.stringValue || "",
      },
    };
  } catch {
    return { error: { message: "No se pudo validar la sesión de Firebase.", status: 502 } };
  }
}

export function listGmailConnections(): { uid: string; email: string }[] {
  if (!fs.existsSync(tempDir())) return [];
  return fs
    .readdirSync(tempDir(), { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^[^/\\]+\.json$/.test(entry.name))
    .flatMap((entry) => {
      try {
        const record = JSON.parse(
          fs.readFileSync(path.join(tempDir(), entry.name), "utf8"),
        ) as Partial<GmailTokenRecord>;
        if (record.uid && record.email) {
          return [{ uid: record.uid, email: record.email }];
        }
      } catch {
        // Ignora archivos incompletos o inválidos; nunca devuelve credenciales.
      }
      return [];
    });
}

export function getGmailConnection(uid: string): GmailTokenRecord | null {
  const filePath = userTokenPath(uid);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as GmailTokenRecord;
  } catch {
    return null;
  }
}

export function reserveGmailAddress(uid: string, email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const indexDir = path.join(tempDir(), "email-index");
  fs.mkdirSync(indexDir, { recursive: true });
  const indexPath = path.join(
    indexDir,
    `${createHash("sha256").update(normalizedEmail).digest("hex")}.json`,
  );
  try {
    const descriptor = fs.openSync(indexPath, "wx", 0o600);
    try {
      fs.writeFileSync(descriptor, JSON.stringify({ uid, email: normalizedEmail }));
    } finally {
      fs.closeSync(descriptor);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    const owner = JSON.parse(fs.readFileSync(indexPath, "utf8")) as {
      uid?: string;
      email?: string;
    };
    if (owner.uid !== uid || owner.email !== normalizedEmail) {
      throw new Error("Esta cuenta de Gmail ya está vinculada a otro usuario.");
    }
  }
}

export function saveGmailConnection(record: GmailTokenRecord) {
  fs.mkdirSync(tempDir(), { recursive: true });
  const filePath = userTokenPath(record.uid);
  const temporaryPath = `${filePath}.${randomBytes(8).toString("hex")}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(record), { mode: 0o600 });
  fs.renameSync(temporaryPath, filePath);
}

export function createOAuthState(uid: string) {
  const state = randomBytes(32).toString("hex");
  const stateDir = path.join(tempDir(), "oauth-state");
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(
    path.join(stateDir, `${state}.json`),
    JSON.stringify({ uid, createdAt: Date.now() }),
    { flag: "wx", mode: 0o600 },
  );
  return state;
}

export function consumeOAuthState(state: string): string | null {
  if (!/^[a-f0-9]{64}$/.test(state)) return null;
  const statePath = path.join(tempDir(), "oauth-state", `${state}.json`);
  try {
    const contents = JSON.parse(fs.readFileSync(statePath, "utf8")) as {
      uid?: string;
      createdAt?: number;
    };
    fs.unlinkSync(statePath);
    if (!contents.uid || !contents.createdAt || Date.now() - contents.createdAt > 10 * 60_000) {
      return null;
    }
    return contents.uid;
  } catch {
    return null;
  }
}
