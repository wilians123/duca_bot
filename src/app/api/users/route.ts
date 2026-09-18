import { NextResponse } from "next/server";

type CreateUserBody = { name?: string; email?: string; password?: string; role?: "admin" | "user" };

const errorMessage = (payload: unknown) => {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: { message?: string } }).error;
    return error?.message || "Firebase rechazó la operación.";
  }
  return "Firebase rechazó la operación.";
};

export async function POST(request: Request) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!apiKey || !projectId || !token) return NextResponse.json({ error: "Se requiere una sesión administrativa." }, { status: 401 });

  try {
    const identityResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: token }) });
    const identity = await identityResponse.json() as { users?: { localId?: string }[] };
    const adminUid = identity.users?.[0]?.localId;
    if (!identityResponse.ok || !adminUid) return NextResponse.json({ error: "Sesión de Firebase inválida." }, { status: 401 });

    const profileResponse = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${adminUid}`, { headers: { Authorization: `Bearer ${token}` } });
    const profile = await profileResponse.json() as { fields?: { role?: { stringValue?: string }; active?: { booleanValue?: boolean } } };
    if (!profileResponse.ok || profile.fields?.role?.stringValue !== "admin" || profile.fields?.active?.booleanValue === false) return NextResponse.json({ error: "Solo un administrador puede crear cuentas." }, { status: 403 });

    const body = await request.json() as CreateUserBody;
    const email = body.email?.trim().toLowerCase();
    if (!email || !body.password || body.password.length < 6 || !body.name?.trim()) return NextResponse.json({ error: "Nombre, correo y contraseña válida son obligatorios." }, { status: 400 });
    const createResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: body.password, returnSecureToken: false }) });
    const created = await createResponse.json() as { localId?: string };
    if (!createResponse.ok || !created.localId) return NextResponse.json({ error: errorMessage(created) }, { status: 400 });
    return NextResponse.json({ uid: created.localId, email });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error interno al crear el usuario." }, { status: 500 });
  }
}
