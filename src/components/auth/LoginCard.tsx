"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "./AuthProvider";
import { ShieldIcon } from "./icons";

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
          : "No fue posible iniciar sesión. Revisa la configuración de Firebase.",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f8fc] px-5 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-[#dbe5ef] bg-white shadow-[0_24px_80px_rgba(16,35,63,0.12)] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden bg-[#10233f] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1d9bb8] text-lg font-bold">
                D
              </span>
              <span className="text-sm font-bold tracking-[0.2em]">
                DUCA BOT
              </span>
            </div>
            <p className="mt-20 text-xs font-semibold uppercase tracking-[0.24em] text-[#8edce7]">
              Control operativo
            </p>
            <h1 className="mt-4 max-w-sm text-4xl font-semibold leading-tight">
              Declaraciones aduaneras con trazabilidad.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">
              Un espacio seguro para operar extracción DUCA-T, revisar
              resultados y monitorear cada conexión.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Plataforma
            protegida con Firebase Auth
          </div>
        </section>
        <section className="p-7 sm:p-10">
          <div className="mb-9 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10233f] font-bold text-white">
              D
            </span>
            <span className="text-sm font-bold tracking-[0.2em] text-[#10233f]">
              DUCA BOT
            </span>
          </div>
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e2f6fa] text-[#147b94]">
            <ShieldIcon className="h-6 w-6" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#147b94]">
            Acceso seguro
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#10233f]">
            Bienvenido de nuevo
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Ingresa con tus credenciales para continuar al panel asignado.
          </p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#10233f]">
                Correo electrónico
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nombre@ducabot.com"
                className="h-12 w-full rounded-xl border-[#cbd8e5] bg-white px-4 text-sm text-[#10233f] placeholder:text-slate-400 focus:border-[#1d9bb8] focus:ring-[#1d9bb8]"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#10233f]">
                Contraseña
              </span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="h-12 w-full rounded-xl border-[#cbd8e5] bg-white px-4 text-sm text-[#10233f] placeholder:text-slate-400 focus:border-[#1d9bb8] focus:ring-[#1d9bb8]"
              />
            </label>
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-[#10233f] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#183557] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Validando acceso..." : "Iniciar sesión"}
            </button>
          </form>
          <p className="mt-8 border-t border-[#e5edf4] pt-5 text-xs leading-5 text-slate-500">
            {" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[#10233f]"></code>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
