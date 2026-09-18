import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/client";

export type RegistroCorreo = {
  idCorreo: string;
  asunto: string;
  remitente: string;
  fecha: string;
  archivosAdjuntos: string[];
  estado: "recibido" | "procesado" | "error";
};

export async function guardarCorreo(registro: RegistroCorreo) {
  return addDoc(collection(db, "correos"), {
    ...registro,
    fechaRegistro: serverTimestamp(),
  });
}
