
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
    // Si no hay usuario o no tiene email, no puede ser admin.
    if (!userToCheck || !userToCheck.email) {
      return false;
    }
    
    // Obtiene la lista de correos de administradores de la variable de entorno.
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
        .toLowerCase()
        .split(',')
        .filter(email => email.trim() !== ''); // Filtra correos vacíos
    
    return adminEmails.includes(userToCheck.email.toLowerCase());
  }, []);

  useEffect(() => {
    // onAuthStateChanged maneja la escucha de cambios de estado de autenticación.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Establece el usuario actual (puede ser null)
      setIsAdmin(checkIsAdmin(currentUser)); // Comprueba si el usuario actual es admin
      setIsLoading(false); // La carga ha terminado, ya sea con usuario o sin él.
    });

    // Se desuscribe del listener al desmontar el componente para evitar fugas de memoria.
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
