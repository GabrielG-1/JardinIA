
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, type User } from "firebase/auth";
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, pass:string) => Promise<{ user: User, isAdmin: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkIsAdmin = useCallback((userToCheck: User | null): boolean => {
    if (!userToCheck || !userToCheck.email) {
      return false;
    }
    
    // La lista de correos de administradores se obtiene de una variable de entorno pública.
    // Esta es la única fuente de verdad para determinar si un usuario es administrador.
    // No se requiere ninguna lectura a Firestore.
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(',');
    
    return adminEmails.includes(userToCheck.email.toLowerCase());
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoading(true);
      const adminStatus = checkIsAdmin(user);
      setUser(user);
      setIsAdmin(adminStatus);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [checkIsAdmin]);

  const signIn = async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    // onAuthStateChanged se encargará de la actualización del estado global.
    // Devolvemos el estado de admin para que el componente de login pueda reaccionar inmediatamente.
    const adminStatus = checkIsAdmin(userCredential.user);
    return { user: userCredential.user, isAdmin: adminStatus };
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    // onAuthStateChanged se encargará de limpiar el estado (user a null, isAdmin a false).
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
