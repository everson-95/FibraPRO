import { db } from '../firebase/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';

const colecao = collection(db, 'pops');

export async function listarPOPs() {
  const snapshot = await getDocs(query(colecao, orderBy('nome')));
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
}

export async function buscarPOP(id) {
  const snapshot = await getDoc(doc(db, 'pops', id));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function salvarPOP(dados) {
  return addDoc(colecao, {
    nome: dados.nome || '',
    sigla: dados.sigla || '',
    cidade: dados.cidade || '',
    endereco: dados.endereco || '',
    latitude: dados.latitude || '',
    longitude: dados.longitude || '',
    maps: dados.maps || '',
    status: dados.status || 'Operacional',
    responsavel: dados.responsavel || '',
    telefone: dados.telefone || '',
    observacao: dados.observacao || '',
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp()
  });
}

export async function atualizarPOP(id, dados) {
  return updateDoc(doc(db, 'pops', id), {
    ...dados,
    atualizadoEm: serverTimestamp()
  });
}

export async function excluirPOP(id) {
  return deleteDoc(doc(db, 'pops', id));
}
