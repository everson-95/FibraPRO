import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes
} from "firebase/storage";
import { storage } from "../firebase/firebase";

function limparNome(nome = "arquivo") {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function criarCaminhoArquivo(modulo, registroId, categoria, nomeArquivo) {
  const nomeSeguro = limparNome(nomeArquivo);
  const sufixo = Math.random().toString(36).slice(2, 8);
  return `${modulo}/${registroId}/${categoria}/${Date.now()}-${sufixo}-${nomeSeguro}`;
}

export async function uploadFile(path, file) {
  if (!file) throw new Error("Nenhum arquivo selecionado.");

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, {
    contentType: file.type || "application/octet-stream"
  });

  return {
    url: await getDownloadURL(storageRef),
    path
  };
}

export async function deleteFile(path) {
  if (!path) return;
  await deleteObject(ref(storage, path));
}
