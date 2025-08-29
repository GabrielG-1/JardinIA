
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, type User } from "firebase/auth";
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, pass:string) => Promise<{ user: User | null, isAdmin: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Esta función se ejecuta en el cliente y comprueba si un email está en la lista de admins
// definida en las variables de entorno.
const checkIsAdminOnClient = (user: User | null): boolean => {
    if (!user || !user.email) return false;
    // Lee la variable de entorno PÚBLICA.
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
        .split(',')
        .map(email => email.trim().toLowerCase());
    return adminEmails.includes(user.email.toLowerCase());
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // onIdTokenChanged es más eficiente que onAuthStateChanged porque se dispara
    // cuando el token cambia (ej: al forzar la actualización), asegurando que los claims
    // de administrador se lean correctamente.
    const unsubscribe = auth.onIdTokenChanged(async (user) => {
      setUser(user);
      if (user) {
        // Forzamos la actualización del token para obtener los claims más recientes.
        const idTokenResult = await user.getIdTokenResult(true); 
        // El claim 'admin' es la fuente de verdad definitiva.
        const hasAdminClaim = !!idTokenResult.claims.admin;
        setIsAdmin(hasAdminClaim);
      } else {
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const loggedInUser = userCredential.user;
    
    // Aunque el listener onIdTokenChanged se encargará de esto, podemos forzar
    // una actualización inmediata aquí para asegurar que el estado sea consistente
    // justo después del login.
    const idTokenResult = await loggedInUser.getIdTokenResult(true);
    const hasAdminClaim = !!idTokenResult.claims.admin;
    
    setIsAdmin(hasAdminClaim);
    setUser(loggedInUser);

    return { user: loggedInUser, isAdmin: hasAdminClaim };
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    // El listener se encargará de poner user a null y isAdmin a false.
  };

  const value = { user, isAdmin, isLoading, signIn, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
