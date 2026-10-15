"use client";

import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { auth, db } from "../../../firebase/client";
import type { UserProfile, UserRole } from "@/types/auth";

const AV_COLORS = [
  "#4F46E5",
  "#0E7C91",
  "#B4700B",
  "#C4304C",
  "#0F9D6E",
  "#6D28D9",
];
function avColor(name: string) {
  const idx =
    [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length;
  return AV_COLORS[idx];
}
function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      width={16}
      height={16}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      width={16}
      height={16}
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "123456",
    role: "user" as UserRole,
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [gmailEmails, setGmailEmails] = useState<Record<string, string>>({});
  const [loadingGmailEmails, setLoadingGmailEmails] = useState(true);

  const loadGmailConnections = useCallback(async () => {
    setLoadingGmailEmails(true);
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
      const response = await fetch("/api/admin/gmail-connections", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        connections?: { uid: string; email: string }[];
      };
      if (!response.ok)
        throw new Error("No se pudieron cargar las conexiones de Gmail.");
      setGmailEmails(
        Object.fromEntries(
          (payload.connections || []).map(({ uid, email }) => [uid, email]),
        ),
      );
    } catch {
      setGmailEmails({});
    } finally {
      setLoadingGmailEmails(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) =>
      setUsers(
        snapshot.docs.map(
          (item) => ({ uid: item.id, ...item.data() }) as UserProfile,
        ),
      ),
    );
    void loadGmailConnections();
    return unsubscribe;
  }, [loadGmailConnections]);

  const createUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });
      const payload = (await response.json()) as {
        uid?: string;
        error?: string;
      };
      if (!response.ok || !payload.uid)
        throw new Error(payload.error || "No se pudo crear la cuenta.");

      await setDoc(doc(db, "users", payload.uid), {
        uid: payload.uid,
        name: newUser.name.trim(),
        email: newUser.email.trim().toLowerCase(),
        role: newUser.role,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setNotice("Cuenta creada. Se envió la contraseña temporal al correo.");
      setNewUser({ name: "", email: "", password: "123456", role: "user" });
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "No se pudo crear el usuario.",
      );
    } finally {
      setSaving(false);
    }
  };

  const saveUser = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", selectedUser.uid), {
        name: selectedUser.name.trim(),
        role: selectedUser.role,
        active: selectedUser.active,
        updatedAt: new Date().toISOString(),
      });
      setNotice("Cambios guardados correctamente.");
      setSelectedUser(null);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el perfil.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="view">
      <div className="page-head">
        <div>
          <h1>Usuarios</h1>
          <p>
            Crea cuentas, cambia permisos y desactiva accesos. Al desactivar, el
            historial de la persona se conserva.
          </p>
        </div>
      </div>

      {notice && (
        <div className="alert alert-info mb-4">
          <span>{notice}</span>
        </div>
      )}

      <div className="grid-2">
        {/* Tabla de cuentas registradas */}
        <section className="card">
          <div className="card-head">
            <h2>Cuentas registradas</h2>
            <div className="flex items-center gap-2">
              <span className="muted text-xs">{users.length} perfiles</span>
              <button
                type="button"
                className="btn btn-quiet btn-sm"
                onClick={() => void loadGmailConnections()}
                disabled={loadingGmailEmails}
                title="Actualizar correos de Gmail vinculados"
              >
                {loadingGmailEmails ? "Actualizando..." : "Actualizar Gmail"}
              </button>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Persona</th>
                  <th>Gmail vinculado</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}></th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 muted">
                      Cargando perfiles...
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const uInitials = initials(u.name || u.email);
                    const bg = avColor(u.name || u.email);
                    const isAdmin = u.role === "admin";
                    const isActive = u.active !== false;

                    return (
                      <tr key={u.uid}>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: ".6rem",
                              minWidth: 0,
                            }}
                          >
                            <span
                              className="avatar"
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 9,
                                fontSize: ".7rem",
                                background: bg,
                              }}
                            >
                              {uInitials}
                            </span>
                            <span style={{ minWidth: 0 }}>
                              <b
                                style={{ display: "block", fontSize: ".85rem" }}
                              >
                                {u.name}
                              </b>
                              <small className="muted text-xs">{u.email}</small>
                            </span>
                          </div>
                        </td>
                        <td>
                          <small className="text-xs">
                            {gmailEmails[u.uid] ||
                              (loadingGmailEmails
                                ? "Consultando..."
                                : "Sin conectar")}
                          </small>
                        </td>
                        <td>
                          <span
                            className={`tag ${isAdmin ? "tag-info" : "tag-neutral"}`}
                          >
                            {isAdmin ? "Administrador" : "Operador"}
                          </span>
                        </td>
                        <td>
                          {isActive ? (
                            <span className="tag tag-ok">
                              <span className="dot" /> Activa
                            </span>
                          ) : (
                            <span className="tag tag-bad">
                              <span className="dot" /> Desactivada
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={() => setSelectedUser(u)}
                            className="btn btn-ghost btn-sm"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Formulario Crear Cuenta */}
        <section className="card" style={{ alignSelf: "start" }}>
          <div className="card-head">
            <h2>Crear cuenta</h2>
          </div>
          <form onSubmit={createUser} className="card-body space-y-3.5">
            <label className="field">
              <span>Nombre y apellido</span>
              <input
                required
                className="input"
                placeholder="Nombre y apellido"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
              />
            </label>

            <label className="field">
              <span>Correo electrónico</span>
              <input
                required
                type="email"
                className="input"
                placeholder="nombre@ducabot.com"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
              />
            </label>

            <label className="field">
              <span>Contraseña</span>
              <input
                required
                type="password"
                minLength={6}
                className="input"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
              />
            </label>

            <label className="field">
              <span>Rol asignado</span>
              <select
                className="input"
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value as UserRole })
                }
              >
                <option value="user">Operador</option>
                <option value="admin">Administrador</option>
              </select>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary btn-block mt-2"
            >
              <PlusIcon />
              <span>{saving ? "Creando..." : "Crear cuenta"}</span>
            </button>

            <p className="muted text-xs mt-2">
              La persona tendrá que cambiar la contraseña la primera vez que
              entre.
            </p>
          </form>
        </section>
      </div>

      {/* Modal Editar Usuario */}
      {selectedUser && (
        <div className="modal" onClick={() => setSelectedUser(null)}>
          <div
            className="modal-box sm"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <header className="modal-head">
              <div style={{ flex: 1 }}>
                <h2>Editar perfil</h2>
                <p>{selectedUser.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="btn btn-quiet btn-sm"
              >
                <CloseIcon />
              </button>
            </header>

            <div className="modal-body space-y-3.5">
              <label className="field">
                <span>Nombre</span>
                <input
                  className="input"
                  value={selectedUser.name}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, name: e.target.value })
                  }
                />
              </label>

              <label className="field">
                <span>Rol</span>
                <select
                  className="input"
                  value={selectedUser.role}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      role: e.target.value as UserRole,
                    })
                  }
                >
                  <option value="user">Operador</option>
                  <option value="admin">Administrador</option>
                </select>
              </label>

              <label className="check mt-3">
                <input
                  type="checkbox"
                  checked={selectedUser.active !== false}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      active: e.target.checked,
                    })
                  }
                />
                <span>Cuenta activa</span>
              </label>
            </div>

            <footer className="modal-foot">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="btn btn-ghost"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={saveUser}
                className="btn btn-primary"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </main>
  );
}
