
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, type User } from "firebase/auth";
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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

  const checkIsAdmin = useCallback(async (user: User | null): Promise<boolean> => {
    if (!user) return false;
    try {
      // Esta es la lógica correcta: comprobar si el documento del admin existe.
      const adminDocRef = doc(db, 'admins', user.uid);
      const adminDoc = await getDoc(adminDocRef);
      return adminDoc.exists();
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      if (user) {
        const adminStatus = await checkIsAdmin(user);
        setUser(user);
        setIsAdmin(adminStatus);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [checkIsAdmin]);

  const signIn = async (email: string, pass: string) => {
    // 1. Autenticar al usuario.
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const loggedInUser = userCredential.user;
    
    // 2. Esperar a que onAuthStateChanged se ejecute y determine el estado de admin.
    // Para devolver el estado correcto, volvemos a comprobarlo aquí.
    const adminStatus = await checkIsAdmin(loggedInUser);

    // No actualizamos el estado aquí para evitar sobrescribir lo que hace onAuthStateChanged,
    // pero devolvemos el estado correcto para que la página de login pueda reaccionar.
    return { user: loggedInUser, isAdmin: adminStatus };
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
