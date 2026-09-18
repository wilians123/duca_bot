"use client";

import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth, db } from "../../../firebase/client";
import type { AuthStatus, UserProfile } from "@/types/auth";

type AuthContextValue = {
  firebaseUser: FirebaseUser | null;
  profile: UserProfile | null;
  status: AuthStatus;
  error: string | null;
  signIn: (email: string, password: string) => Promise<UserProfile>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const inactivityMinutes = Number(process.env.NEXT_PUBLIC_SESSION_INACTIVITY_MINUTES || 30);
const inactivityLimit = Math.max(5, inactivityMinutes) * 60_000;

const defaultProfile = (user: FirebaseUser): UserProfile => ({
  uid: user.uid,
  name: user.displayName || user.email?.split("@")[0] || "Usuario",
  email: user.email || "",
  role: "user",
  active: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let profileUnsubscribe: (() => void) | undefined;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      profileUnsubscribe?.();
      profileUnsubscribe = undefined;
      setFirebaseUser(user);
      setError(null);
      if (!user) {
        setProfile(null);
        setStatus("unauthenticated");
        return;
      }
      const profileRef = doc(db, "users", user.uid);
      profileUnsubscribe = onSnapshot(profileRef, async (snapshot) => {
        if (!snapshot.exists()) {
          const created = defaultProfile(user);
          await setDoc(profileRef, created, { merge: true });
          setProfile(created);
          setStatus("authenticated");
          return;
        }
        const nextProfile = { ...defaultProfile(user), ...snapshot.data(), uid: user.uid } as UserProfile;
        if (nextProfile.active === false) {
          setError("Tu cuenta está desactivada. Contacta a un administrador.");
          await signOut(auth);
          return;
        }
        setProfile(nextProfile);
        setStatus("authenticated");
      }, (snapshotError) => {
        setError(`No se pudo cargar el perfil: ${snapshotError.message}`);
        setStatus("unauthenticated");
      });
    });
    return () => { unsubscribe(); profileUnsubscribe?.(); };
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    let lastActivity = Date.now();
    const markActivity = () => { lastActivity = Date.now(); };
    const events = ["pointerdown", "keydown", "mousemove", "touchstart"];
    events.forEach((event) => window.addEventListener(event, markActivity, { passive: true }));
    const timer = window.setInterval(() => {
      if (Date.now() - lastActivity >= inactivityLimit) {
        setError("Sesión cerrada por inactividad.");
        void signOut(auth);
      }
    }, 30_000);
    return () => { events.forEach((event) => window.removeEventListener(event, markActivity)); window.clearInterval(timer); };
  }, [firebaseUser]);

  const value = useMemo<AuthContextValue>(() => ({
    firebaseUser,
    profile,
    status,
    error,
    signIn: async (email, password) => {
      setError(null);
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const snapshot = await getDoc(doc(db, "users", credential.user.uid));
      return snapshot.exists() ? ({ ...defaultProfile(credential.user), ...snapshot.data(), uid: credential.user.uid } as UserProfile) : defaultProfile(credential.user);
    },
    signOutUser: () => signOut(auth),
  }), [error, firebaseUser, profile, status]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe utilizarse dentro de AuthProvider");
  return context;
}
