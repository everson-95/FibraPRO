import { useEffect, useState } from 'react';
import { observeCollection } from '../services/firestoreCrud';

export default function useFirestoreCollection(collectionName, options = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const whereKey = JSON.stringify(options.where || []);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = observeCollection(
      collectionName,
      data => { setItems(data); setLoading(false); setError(null); },
      err => { console.error(err); setError(err); setLoading(false); },
      options
    );
    return unsubscribe;
  }, [collectionName, options.orderBy, options.direction, whereKey]);

  return { items, loading, error };
}
