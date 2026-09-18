"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "./AuthProvider";

export function LoginCard() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signIn(email, password);
      router.replace("/dashboard");
    } catch (signInError) {
      const code =
        signInError && typeof signInError === "object" && "code" in signInError
          ? String(signInError.code)
          : "";
      setError(
        code.includes("invalid-credential")
          ? "Correo o contraseña incorrectos."
          : "No fue posible iniciar sesión. Revisa tus credenciales.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      {/* Panel izquierdo con arte y pasos del flujo */}
      <section className="login-art">
        <div style={{ display: "flex", alignItems: "center", gap: ".7rem" }}>
          <span
            style={{
              width: 38,
              height: 38,
              flexShrink: 0,
              borderRadius: 11,
              background: "linear-gradient(140deg,#4F46E5,#0E7C91)",
              display: "grid",
              placeItems: "center",
              color: "#fff",
              fontWeight: 700,
              fontFamily: 'var(--mono, "Fira Code", monospace)',
              fontSize: "1rem",
            }}
          >
            DB
          </span>
          <div>
            <b style={{ display: "block", color: "#fff", fontSize: ".9rem", letterSpacing: ".04em" }}>
              DUCAS BOT
            </b>
            <small style={{ color: "#A9B6CC", fontSize: ".72rem" }}>
              Automatización aduanera
            </small>
          </div>
        </div>

        <div>
          <h2>El flujo completo de tu agencia, en un solo lugar.</h2>
          <p>
            Lee correos de clientes, extrae los documentos de embarque con inteligencia
            artificial, revisa los datos y radícalos en SIECA.
          </p>

          <div className="flowline">
            <div>
              <i>1</i> Conexión a Gmail de operaciones
            </div>
            <div>
              <i>2</i> Extracción de factura, carta de porte y manifiesto
            </div>
            <div>
              <i>3</i> Validación de inconsistencias
            </div>
            <div>
              <i>4</i> Previsualización idéntica al formulario oficial
            </div>
            <div>
              <i>5</i> Envío automatizado con trazabilidad
            </div>
          </div>
        </div>

        <small style={{ color: "#7A88A3", fontSize: ".76rem" }}>
          Versión 2.4 · Plataforma protegida con Firebase Auth
        </small>
      </section>

      {/* Panel derecho con formulario */}
      <section className="login-form">
        <div className="login-card card">
          <div className="card-body">
            <div className="mb-4 flex items-center gap-2 lg:hidden">
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: "linear-gradient(140deg,#4F46E5,#0E7C91)",
                  display: "grid",
                  placeItems: "center",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: ".8rem",
                  fontFamily: 'var(--mono, "Fira Code", monospace)',
                }}
              >
                DB
              </span>
              <b style={{ fontSize: ".88rem", letterSpacing: ".04em" }}>DUCAS BOT</b>
            </div>

            <h1 style={{ fontSize: "1.35rem" }}>Entra a tu cuenta</h1>
            <p className="muted" style={{ fontSize: ".85rem", marginTop: ".25rem", marginBottom: "1.1rem" }}>
              Usa tus credenciales asignadas para acceder al sistema.
            </p>

            <form onSubmit={submit} className="space-y-3.5">
              <label className="field">
                <span>Correo electrónico</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@ducabot.com"
                  className="input"
                />
              </label>

              <label className="field">
                <span>Contraseña</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input"
                />
              </label>

              <label className="check" style={{ margin: ".8rem 0" }}>
                <input type="checkbox" defaultChecked />
                <span style={{ fontSize: ".82rem" }}>Mantener sesión iniciada</span>
              </label>

              {error && (
                <div className="alert alert-warn" role="alert" style={{ padding: ".65rem .85rem", fontSize: ".8rem" }}>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-block"
              >
                {loading ? "Validando acceso..." : "Entrar al sistema"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
