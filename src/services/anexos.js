import { db } from "../firebase/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";

const colecao = collection(db, "anexos");

export async function salvarAnexo(dados) {
  const referencia = await addDoc(colecao, {
    ...dados,
    criadoEm: serverTimestamp()
  });

  return referencia.id;
}

export function observarAnexos(parentType, parentId, categoria, aoAtualizar, aoErro) {
  const consulta = query(
    colecao,
    where("parentId", "==", parentId)
  );

  return onSnapshot(
    consulta,
    snapshot => {
      const itens = snapshot.docs
        .map(documento => ({ id: documento.id, ...documento.data() }))
        .filter(item => item.parentType === parentType && item.categoria === categoria)
        .sort((a, b) => {
          const dataA = a.criadoEm?.toMillis?.() || 0;
          const dataB = b.criadoEm?.toMillis?.() || 0;
          return dataB - dataA;
        });

      aoAtualizar(itens);
    },
    aoErro
  );
}

export async function excluirAnexo(id) {
  await deleteDoc(doc(db, "anexos", id));
}

export async function atualizarAnexo(id, dados) {
  await updateDoc(doc(db, "anexos", id), dados);
}
