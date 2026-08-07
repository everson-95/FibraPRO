import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase/firebase';

const ADMIN_UID = 'uGqrREimmTew1vmPhWQw99Y6viB3';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, current => {
    setUser(current);
    setLoading(false);
  }), []);

  const value = useMemo(() => ({
    user,
    loading,
    isAdmin: user?.uid === ADMIN_UID,
    async login(email, password) {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (credential.user.uid !== ADMIN_UID) {
        await signOut(auth);
        throw new Error('Este usuário não possui permissão de administrador.');
      }
      return credential.user;
    },
    logout: () => signOut(auth)
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth precisa estar dentro de AuthProvider.');
  return context;
}
