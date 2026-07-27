import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export default function useFirestoreDocument(collectionName, id) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    return onSnapshot(doc(db, collectionName, id), snapshot => {
      setItem(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
      setLoading(false);
    }, err => { console.error(err); setError(err); setLoading(false); });
  }, [collectionName, id]);

  return { item, loading, error };
}
