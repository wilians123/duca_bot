"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import {
  ActivityIcon,
  ChartIcon,
  CloseIcon,
  DocumentIcon,
  GridIcon,
  LogoutIcon,
  MenuIcon,
  UsersIcon,
} from "./icons";
import { UserHistoryPanel } from "./UserHistoryPanel";

const navItem =
  "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors duration-200";
const adminPaths = ["/usuarios", "/reportes"];

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, status, signOutUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (pathname !== "/login" && status === "unauthenticated")
      router.replace("/login");
    if (adminPaths.includes(pathname) && profile && profile.role !== "admin")
      router.replace("/dashboard");
  }, [pathname, profile, router, status]);

  if (pathname === "/login") return <>{children}</>;
  if (status === "loading")
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f8fc] text-sm text-slate-600">
        Cargando sesión segura...
      </div>
    );
  if (!profile)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f8fc] text-sm text-slate-600">
        Redirigiendo al inicio de sesión...
      </div>
    );
  if (adminPaths.includes(pathname) && profile.role !== "admin")
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f8fc] text-sm text-slate-600">
        No tienes permisos para este panel.
      </div>
    );

  const isAdmin = profile.role === "admin";
  const items = isAdmin
    ? [
        { href: "/dashboard", label: "Dashboard", icon: GridIcon },
        { href: "/usuarios", label: "Administrar usuarios", icon: UsersIcon },
        { href: "/reportes", label: "Reportes", icon: ChartIcon },
      ]
    : [
        { href: "/dashboard", label: "Dashboard", icon: GridIcon },
        { href: "/duca-t/paso-1", label: "Flujo DUCA-T", icon: DocumentIcon },
        {
          href: "/dashboard#historial",
          label: "Historial diario",
          icon: ActivityIcon,
        },
      ];
  const logout = async () => {
    await signOutUser();
    router.replace("/login");
  };
  const initials = profile.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const isActive = (href: string) =>
    pathname === href || (href === "/dashboard" && pathname === "/");

  const sidebar = (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#10233f] px-3 py-5 text-white shadow-2xl transition-[width,transform] duration-200 md:translate-x-0 ${collapsed ? "md:w-[84px]" : "md:w-[272px]"} ${menuOpen ? "w-[272px] translate-x-0" : "w-[272px] -translate-x-full"}`}
    >
      <div
        className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} px-2`}
      >
        <Link
          href="/dashboard"
          onClick={() => setMenuOpen(false)}
          className="flex min-w-0 items-center gap-3"
          title="Ir al Dashboard"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1d9bb8] font-bold">
            D
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block text-sm font-bold tracking-[0.16em]">
                DUCA-BOT
              </span>
              <span className="block text-[10px] uppercase tracking-[0.18em] text-slate-400">
                Control operativo
              </span>
            </span>
          )}
        </Link>
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMenuOpen(false)}
          className="rounded-lg p-2 text-slate-300 hover:bg-white/10 md:hidden"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>
      <div
        className={`mt-10 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ${collapsed ? "text-center" : ""}`}
      >
        {collapsed ? "·" : "Navegación"}
      </div>
      <nav className="mt-3 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              title={collapsed ? item.label : undefined}
              aria-current={active ? "page" : undefined}
              className={`${navItem} ${collapsed ? "justify-center px-0" : ""} ${active ? "bg-white/12 text-white" : "text-slate-300 hover:bg-white/8 hover:text-white"}`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 ${active ? "text-[#8edce7]" : "text-slate-400 group-hover:text-[#8edce7]"}`}
              />
              {!collapsed && <span>{item.label}</span>}
              {active && !collapsed && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#8edce7]" />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto">
        <button
          type="button"
          aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          onClick={() => setCollapsed((value) => !value)}
          className={`mb-4 flex w-full items-center rounded-xl border border-white/10 px-3 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white ${collapsed ? "justify-center px-0" : "gap-2"}`}
          title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          <span className="text-base leading-none">
            {collapsed ? "»" : "«"}
          </span>
          {!collapsed && <span>Colapsar menú</span>}
        </button>
        <div
          className={`rounded-2xl border border-white/10 bg-white/5 p-3 ${collapsed ? "px-2" : ""}`}
        >
          <div
            className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1d9bb8]/20 text-sm font-bold text-[#a9edf2]"
              title={profile.name}
            >
              {initials}
            </span>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {profile.name}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {profile.email}
                </p>
              </div>
            )}
          </div>
          {!collapsed && (
            <>
              <div className="mt-4 flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> En
                  línea
                </span>
                <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#a9edf2]">
                  {isAdmin ? "Administrador" : "Usuario"}
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                <LogoutIcon className="h-4 w-4" /> Cerrar sesión
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <div
      className={`min-h-screen bg-[#f5f8fc] ${collapsed ? "md:pl-[84px]" : "md:pl-[272px]"}`}
    >
      {sidebar}
      <div
        className="fixed inset-0 z-40 bg-[#10233f]/40 md:hidden"
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
        hidden={!menuOpen}
      />
      <div className="flex h-16 items-center justify-between border-b border-[#dbe5ef] bg-white px-4 md:hidden">
        <button
          type="button"
          aria-label="Abrir menú"
          onClick={() => setMenuOpen(true)}
          className="rounded-lg p-2 text-[#10233f] hover:bg-slate-100"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2 text-sm font-semibold text-[#10233f]">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          {isAdmin ? "Panel administrativo" : "Operación DUCA-T"}
        </div>
        <span className="w-10" />
      </div>
      <div className="min-h-screen">
        {children}
        {!isAdmin && (pathname === "/" || pathname === "/dashboard") && (
          <div id="historial" className="px-4 pb-10 lg:px-8">
            <UserHistoryPanel profile={profile} />
          </div>
        )}
      </div>
    </div>
  );
}
