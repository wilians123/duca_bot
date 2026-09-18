import fs from "node:fs";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

const env = Object.fromEntries(fs.readFileSync(".env", "utf8").split(/\r?\n/).filter((line) => line && !line.startsWith("#") && line.includes("=")).map((line) => { const index = line.indexOf("="); return [line.slice(0, index), line.slice(index + 1).replace(/^"|"$/g, "")]; }));
const app = initializeApp({ apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY, authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, appId: env.NEXT_PUBLIC_FIREBASE_APP_ID });
const auth = getAuth(app);
const db = getFirestore(app);
const accounts = [{ name: "Will Admin", email: "will_admin@ducabot.com", password: "123456", role: "admin" }, { name: "Will User", email: "will_user@ducabot.com", password: "123456", role: "user" }];

for (const account of accounts) {
  try {
    try { await signInWithEmailAndPassword(auth, account.email, account.password); }
    catch { await createUserWithEmailAndPassword(auth, account.email, account.password); }
    const current = auth.currentUser;
    if (!current) throw new Error(`Firebase no devolvió UID para ${account.email}`);
    const profileRef = doc(db, "users", current.uid);
    const existing = await getDoc(profileRef);
    await setDoc(profileRef, { uid: current.uid, name: account.name, email: account.email, role: account.role, active: existing.exists() ? existing.data().active !== false : true, createdAt: existing.exists() ? existing.data().createdAt : new Date().toISOString(), updatedAt: new Date().toISOString() }, { merge: true });
    console.log(`OK ${account.email} (${account.role}) -> ${current.uid}`);
  } finally { await signOut(auth); }
}
console.log("Seed completado. Contraseña de ambas cuentas: 123456");
