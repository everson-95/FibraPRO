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

const colecao = collection(db, "ceos");

// LISTAR TODAS AS CEOs
export async function listarCEOs() {

  const q = query(
    colecao,
    orderBy("nome")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

}

// SALVAR NOVA CEO
export async function salvarCEO(dados) {

  return await addDoc(
    colecao,
    {
      nome: dados.nome || "",
      tipo: dados.tipo || "",
      rota: dados.rota || "",

      status: dados.status || "Operacional",

      km: dados.km || "",

      latitude: dados.latitude || "",
      longitude: dados.longitude || "",

      referencia: dados.referencia || "",
      maps: dados.maps || "",

      observacao: dados.observacao || "",
      foto: dados.foto || "",
      fotoNome: dados.fotoNome || "",

      criadoEm: new Date()
    }
  );

}

// BUSCAR UMA CEO
export async function buscarCEO(id) {

  const referencia = doc(db, "ceos", id);

  const documento = await getDoc(referencia);

  if (!documento.exists()) return null;

  return {
    id: documento.id,
    ...documento.data()
  };

}

// ATUALIZAR CEO
export async function atualizarCEO(id, dados) {

  const referencia = doc(db, "ceos", id);

  await updateDoc(
    referencia,
    dados
  );

}

// EXCLUIR CEO
export async function excluirCEO(id) {

  const referencia = doc(db, "ceos", id);

  await deleteDoc(referencia);

}