"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";

const adminPaths = ["/usuarios", "/reportes"];

// ── Iconos SVG inline del boceto ──────────────────────────────────────────────
function InboxSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-[18px] w-[18px] flex-none opacity-85">
      <path d="M3 12h5l2 3h4l2-3h5"/><path d="M5 5h14l2 7v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5z"/>
    </svg>
  );
}
function HistorySvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-[18px] w-[18px] flex-none opacity-85">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 4v4h4"/><path d="M12 8v4l3 2"/>
    </svg>
  );
}
function PlugSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-[18px] w-[18px] flex-none opacity-85">
      <path d="M9 3v6M15 3v6"/><path d="M6 9h12v3a6 6 0 0 1-12 0z"/><path d="M12 18v3"/>
    </svg>
  );
}
function GridSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-[18px] w-[18px] flex-none opacity-85">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  );
}
function UsersSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-[18px] w-[18px] flex-none opacity-85">
      <circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.5a3 3 0 0 1 0 5"/><path d="M18 20a5.5 5.5 0 0 0-2-4"/>
    </svg>
  );
}
function ChartSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-[18px] w-[18px] flex-none opacity-85">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>
    </svg>
  );
}
function ChevronSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={14} height={14} className="flex-none">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
function LogoutSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
    </svg>
  );
}
function BarsSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={20} height={20}>
      <path d="M3 6h18M3 12h18M3 18h18"/>
    </svg>
  );
}
function CloseSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={20} height={20}>
      <path d="M18 6 6 18M6 6l12 12"/>
    </svg>
  );
}
function HelpSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={20} height={20}>
      <circle cx="12" cy="12" r="9"/><path d="M9.2 9a2.8 2.8 0 0 1 5.4 1c0 2-2.6 2.5-2.6 2.5"/><path d="M12 17h.01"/>
    </svg>
  );
}

// ── Utilidades de avatar ──────────────────────────────────────────────────────
const AV_COLORS = ["#4F46E5", "#0E7C91", "#B4700B", "#C4304C", "#0F9D6E", "#6D28D9"];
function avColor(name: string) {
  const idx = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length;
  return AV_COLORS[idx];
}
function getInitials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

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
      <div
        className="flex min-h-screen items-center justify-center text-sm"
        style={{ background: "#F2F5FA", color: "#64748B" }}
      >
        Cargando sesión segura...
      </div>
    );
  if (!profile)
    return (
      <div
        className="flex min-h-screen items-center justify-center text-sm"
        style={{ background: "#F2F5FA", color: "#64748B" }}
      >
        Redirigiendo al inicio de sesión...
      </div>
    );
  if (adminPaths.includes(pathname) && profile.role !== "admin")
    return (
      <div
        className="flex min-h-screen items-center justify-center text-sm"
        style={{ background: "#F2F5FA", color: "#64748B" }}
      >
        No tienes permisos para este panel.
      </div>
    );

  const isAdmin = profile.role === "admin";

  // ── Ítems de navegación por rol (exacto del boceto) ──────────────────────
  type NavItem = { href: string; label: string; icon: React.ReactNode; badge?: string };
  const items: NavItem[] = isAdmin
    ? [
        { href: "/dashboard", label: "Resumen", icon: <GridSvg /> },
        { href: "/usuarios", label: "Usuarios", icon: <UsersSvg /> },
        { href: "/reportes", label: "Reportes", icon: <ChartSvg /> },
      ]
    : [
        { href: "/dashboard", label: "Trámite nuevo", icon: <InboxSvg />, badge: "4" },
        { href: "/historial", label: "Historial de trámites", icon: <HistorySvg /> },
        { href: "/conexiones", label: "Conexiones", icon: <PlugSvg /> },
      ];

  const logout = async () => {
    await signOutUser();
    router.replace("/login");
  };

  const initials = getInitials(profile.name);
  const avatarBg = avColor(profile.name);

  const isActive = (href: string) =>
    pathname === href || (href === "/dashboard" && (pathname === "/" || pathname === "/dashboard"));

  // ── Breadcrumb label (similar al boceto) ─────────────────────────────────
  const crumbRoot = isAdmin ? "Administración" : "Operación";
  const crumbLeaf = isAdmin
    ? pathname === "/usuarios" ? "Usuarios" : pathname === "/reportes" ? "Reportes" : "Resumen"
    : pathname === "/historial"
      ? "Historial de trámites"
      : pathname === "/conexiones"
        ? "Conexiones"
        : "Trámite nuevo";

  // ── Sidebar ───────────────────────────────────────────────────────────────
  const sidebarWidth = collapsed ? "76px" : "272px";

  return (
    <div style={{ background: "#F2F5FA", minHeight: "100vh" }}>
      {/* Scrim móvil */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[60]"
          style={{ background: "rgba(15,28,51,.5)" }}
          onClick={() => setMenuOpen(false)}
          aria-hidden
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        aria-label="Navegación principal"
        style={{
          position: "fixed",
          inset: "0 auto 0 0",
          zIndex: 70,
          width: menuOpen ? "272px" : sidebarWidth,
          display: "flex",
          flexDirection: "column",
          background: "#0F1C33",
          color: "#D6DEEC",
          transform: menuOpen ? "translateX(0)" : undefined,
          transition: "width .2s ease, transform .22s ease",
        }}
        className={!menuOpen ? "hidden md:flex" : "flex"}
      >
        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: ".7rem",
            padding: "1rem 1rem .9rem",
            borderBottom: "1px solid rgba(255,255,255,.08)",
            position: "relative",
            justifyContent: collapsed ? "center" : undefined,
          }}
        >
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
              fontFamily: '"Fira Code", monospace',
              fontSize: "1rem",
            }}
          >
            DB
          </span>
          {!collapsed && (
            <span style={{ minWidth: 0 }}>
              <b style={{ display: "block", color: "#fff", fontSize: ".9rem", letterSpacing: ".04em" }}>
                DUCAS BOT
              </b>
              <small style={{ display: "block", fontSize: ".7rem", color: "#8C9BB5" }}>
                Control operativo
              </small>
            </span>
          )}
          {/* Control de colapso (solo escritorio): únicamente la flecha */}
          <button
            type="button"
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
            onClick={() => setCollapsed((v) => !v)}
            className="hidden md:flex"
            style={{
              position: collapsed ? "absolute" : undefined,
              top: collapsed ? 10 : undefined,
              right: collapsed ? 8 : undefined,
              width: 28,
              height: 28,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              color: "#C2CCDD",
              fontSize: "1.35rem",
              lineHeight: 1,
            }}
          >
            {collapsed ? "›" : "‹"}
          </button>

          {/* Botón cerrar (solo móvil) */}
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
            className="md:hidden ml-auto"
            style={{ color: "#8C9BB5", padding: ".4rem", borderRadius: 8 }}
          >
            <CloseSvg />
          </button>
        </div>

        {/* Scroll de navegación */}
        <div style={{ flex: 1, overflowY: "auto", padding: ".85rem .65rem" }}>
          <p
            style={{
              padding: ".7rem .6rem .35rem",
              fontSize: ".7rem",
              color: "#7A88A3",
              fontWeight: 600,
              display: collapsed ? "none" : "block",
            }}
          >
            {isAdmin ? "Administración" : "Operación"}
          </p>
          <nav>
            {items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: ".7rem",
                    width: "100%",
                    padding: ".62rem .6rem",
                    borderRadius: 9,
                    marginBottom: 2,
                    color: active ? "#fff" : "#C2CCDD",
                    fontSize: ".875rem",
                    fontWeight: 500,
                    textDecoration: "none",
                    background: active ? "rgba(79,70,229,.26)" : "transparent",
                    boxShadow: active ? "inset 2px 0 0 #8B85F5" : "none",
                    justifyContent: collapsed ? "center" : undefined,
                    transition: "background .15s ease, color .15s ease",
                  }}
                >
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: ".68rem",
                        fontFamily: '"Fira Code", monospace',
                        background: "rgba(255,255,255,.12)",
                        padding: ".05rem .38rem",
                        borderRadius: 5,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer del sidebar */}
        <div style={{ padding: ".8rem", borderTop: "1px solid rgba(255,255,255,.08)" }}>
          {/* Usuario */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: ".65rem",
              padding: ".55rem",
              borderRadius: 11,
              background: "rgba(255,255,255,.06)",
              minWidth: 0,
              justifyContent: collapsed ? "center" : undefined,
            }}
          >
            <span
              style={{
                width: 34,
                height: 34,
                flexShrink: 0,
                borderRadius: 10,
                background: avatarBg,
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontSize: ".78rem",
                fontWeight: 700,
              }}
              title={profile.name}
            >
              {initials}
            </span>
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: ".82rem", color: "#fff", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {profile.name}
                </p>
                <small style={{ fontSize: ".7rem", color: "#8C9BB5", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {profile.email}
                </small>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              type="button"
              onClick={logout}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: ".5rem",
                width: "100%",
                marginTop: ".6rem",
                padding: ".55rem",
                borderRadius: 9,
                border: "1px solid rgba(255,255,255,.12)",
                color: "#C2CCDD",
                fontSize: ".8rem",
                fontWeight: 600,
              }}
            >
              <LogoutSvg />
              <span>Cerrar sesión</span>
            </button>
          )}
        </div>
      </aside>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <div
        style={{
          paddingLeft: sidebarWidth,
          minHeight: "100vh",
          transition: "padding-left .2s ease",
        }}
        className="hidden md:block"
      >
        {/* Topbar */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            gap: ".75rem",
            height: 60,
            padding: "0 clamp(.85rem,2vw,1.5rem)",
            background: "rgba(255,255,255,.92)",
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid #DCE3EE",
          }}
        >
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: ".45rem", minWidth: 0, fontSize: ".82rem", color: "#64748B" }}>
            <span>{crumbRoot}</span>
            <ChevronSvg />
            <b style={{ color: "#0F1C33", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {crumbLeaf}
            </b>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: ".4rem" }}>
            {/* Role pill */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: ".4rem",
                padding: ".3rem .6rem",
                borderRadius: 999,
                background: "#EEF1F8",
                fontSize: ".74rem",
                fontWeight: 600,
                color: "#31415C",
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#0F9D6E", flexShrink: 0 }} />
              {isAdmin ? "Administrador" : "Operador"}
            </span>
            {/* Help button */}
            <button
              type="button"
              aria-label="Ayuda"
              style={{
                display: "grid",
                placeItems: "center",
                width: 38,
                height: 38,
                borderRadius: 9,
                color: "#31415C",
              }}
            >
              <HelpSvg />
            </button>
            {/* Avatar */}
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: avatarBg,
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontSize: ".72rem",
                fontWeight: 700,
                flexShrink: 0,
              }}
              title={profile.name}
            >
              {initials}
            </span>
          </div>
        </header>

        <div style={{ minHeight: "calc(100vh - 60px)" }}>
          {children}
        </div>
      </div>

      {/* ── LAYOUT MÓVIL ── */}
      <div className="md:hidden" style={{ minHeight: "100vh" }}>
        {/* Mobile topbar */}
        <div
          style={{
            display: "flex",
            height: 60,
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #DCE3EE",
            background: "#fff",
            padding: "0 1rem",
          }}
        >
          <button
            type="button"
            aria-label="Abrir menú"
            onClick={() => setMenuOpen(true)}
            style={{ borderRadius: 8, padding: ".5rem", color: "#0F1C33" }}
          >
            <BarsSvg />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: ".5rem", fontSize: ".875rem", fontWeight: 600, color: "#0F1C33" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0F9D6E" }} />
            {isAdmin ? "Panel administrativo" : "Operación DUCA-T"}
          </div>
          <span style={{ width: 38 }} />
        </div>

        {/* Mobile sidebar overlay */}
        {menuOpen && (
          <aside
            style={{
              position: "fixed",
              inset: "0 auto 0 0",
              zIndex: 70,
              width: 272,
              display: "flex",
              flexDirection: "column",
              background: "#0F1C33",
              color: "#D6DEEC",
            }}
          >
            {/* Brand */}
            <div style={{ display: "flex", alignItems: "center", gap: ".7rem", padding: "1rem", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
              <span style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 11, background: "linear-gradient(140deg,#4F46E5,#0E7C91)", display: "grid", placeItems: "center", color: "#fff", fontWeight: 700, fontFamily: '"Fira Code", monospace', fontSize: "1rem" }}>
                DB
              </span>
              <span style={{ minWidth: 0 }}>
                <b style={{ display: "block", color: "#fff", fontSize: ".9rem", letterSpacing: ".04em" }}>DUCAS BOT</b>
                <small style={{ display: "block", fontSize: ".7rem", color: "#8C9BB5" }}>Control operativo</small>
              </span>
              <button type="button" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} style={{ marginLeft: "auto", color: "#8C9BB5", padding: ".4rem", borderRadius: 8 }}>
                <CloseSvg />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: ".85rem .65rem" }}>
              <p style={{ padding: ".7rem .6rem .35rem", fontSize: ".7rem", color: "#7A88A3", fontWeight: 600 }}>
                {isAdmin ? "Administración" : "Operación"}
              </p>
              <nav>
                {items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                      style={{ display: "flex", alignItems: "center", gap: ".7rem", width: "100%", padding: ".62rem .6rem", borderRadius: 9, marginBottom: 2, color: active ? "#fff" : "#C2CCDD", fontSize: ".875rem", fontWeight: 500, textDecoration: "none", background: active ? "rgba(79,70,229,.26)" : "transparent", boxShadow: active ? "inset 2px 0 0 #8B85F5" : "none" }}>
                      {item.icon}
                      <span>{item.label}</span>
                      {item.badge && <span style={{ marginLeft: "auto", fontSize: ".68rem", fontFamily: '"Fira Code", monospace', background: "rgba(255,255,255,.12)", padding: ".05rem .38rem", borderRadius: 5 }}>{item.badge}</span>}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div style={{ padding: ".8rem", borderTop: "1px solid rgba(255,255,255,.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: ".65rem", padding: ".55rem", borderRadius: 11, background: "rgba(255,255,255,.06)" }}>
                <span style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 10, background: avatarBg, color: "#fff", display: "grid", placeItems: "center", fontSize: ".78rem", fontWeight: 700 }}>{initials}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: ".82rem", color: "#fff", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.name}</p>
                  <small style={{ fontSize: ".7rem", color: "#8C9BB5", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.email}</small>
                </div>
              </div>
              <button type="button" onClick={logout} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: ".5rem", width: "100%", marginTop: ".6rem", padding: ".55rem", borderRadius: 9, border: "1px solid rgba(255,255,255,.12)", color: "#C2CCDD", fontSize: ".8rem", fontWeight: 600 }}>
                <LogoutSvg /><span>Cerrar sesión</span>
              </button>
            </div>
          </aside>
        )}

        <div>
          {children}
        </div>
      </div>
    </div>
  );
}
