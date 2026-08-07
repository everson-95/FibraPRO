import { db } from '../firebase/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  setDoc,
  where
} from 'firebase/firestore';

export function observeCollection(collectionName, callback, onError, options = {}) {
  const ref = collection(db, collectionName);
  const constraints = [];
  if (options.where) {
    for (const [field, operator, value] of options.where) constraints.push(where(field, operator, value));
  }
  if (options.orderBy) constraints.push(orderBy(options.orderBy, options.direction || 'asc'));
  const source = constraints.length ? query(ref, ...constraints) : ref;
  return onSnapshot(source, snapshot => {
    callback(snapshot.docs.map(item => ({ id: item.id, ...item.data() })));
  }, onError);
}

export async function createRecord(collectionName, data) {
  return addDoc(collection(db, collectionName), {
    ...data,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp()
  });
}

export async function readRecord(collectionName, id) {
  const snapshot = await getDoc(doc(db, collectionName, id));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function updateRecord(collectionName, id, data) {
  return updateDoc(doc(db, collectionName, id), {
    ...data,
    atualizadoEm: serverTimestamp()
  });
}

export async function deleteRecord(collectionName, id) {
  return deleteDoc(doc(db, collectionName, id));
}

export async function setRecord(collectionName, id, data) {
  return setDoc(doc(db, collectionName, id), { ...data, atualizadoEm: serverTimestamp() }, { merge: true });
}
