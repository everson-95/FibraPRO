import { db } from "../firebase/firebase";

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from "firebase/firestore";

const colecao = collection(db, "darkFiber");

// LISTAR
export async function listarDarkFiber() {

  const q = query(
    colecao,
    orderBy("rota")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

}

// SALVAR
export async function salvarDarkFiber(dados) {

  return await addDoc(
    colecao,
    {
      cliente: dados.cliente || "",
      rota: dados.rota || "",
      fibras: dados.fibras || "",
      origem: dados.origem || "",
      destino: dados.destino || "",

      latOrigem: dados.latOrigem || "",
      lngOrigem: dados.lngOrigem || "",

      latDestino: dados.latDestino || "",
      lngDestino: dados.lngDestino || "",

      cabo: dados.cabo || "",

      status: dados.status || "Em uso",

      observacao: dados.observacao || "",

      criadoEm: new Date()
    }
  );

}

// BUSCAR
export async function buscarDarkFiber(id) {

  const referencia = doc(db, "darkFiber", id);

  const documento = await getDoc(referencia);

  if (!documento.exists()) return null;

  return {
    id: documento.id,
    ...documento.data()
  };

}

// ATUALIZAR
export async function atualizarDarkFiber(id, dados) {

  const referencia = doc(db, "darkFiber", id);

  await updateDoc(referencia, dados);

}

// EXCLUIR
export async function excluirDarkFiber(id) {

  const referencia = doc(db, "darkFiber", id);

  await deleteDoc(referencia);

}