
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

const checkIsAdminOnClient = (user: User | null): boolean => {
    if (!user || !user.email) return false;
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Al cambiar el estado de autenticación, obtenemos el token más reciente con los claims.
        const idTokenResult = await user.getIdTokenResult(true); // Forzar actualización
        setIsAdmin(!!idTokenResult.claims.admin);
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
    
    // Verificamos si es un admin usando la lista de correos del lado del cliente.
    const isClientSideAdmin = checkIsAdminOnClient(loggedInUser);

    // Forzamos la actualización del token para obtener los nuevos claims (si los hubiera)
    // El onAuthStateChanged se encargará de actualizar el estado de `isAdmin`.
    const idTokenResult = await loggedInUser.getIdTokenResult(true);
    const hasAdminClaim = !!idTokenResult.claims.admin;

    // La verdadera fuente de verdad es el claim, pero la comprobación del cliente es una buena fallback.
    const isAdminUser = hasAdminClaim || isClientSideAdmin;
    setIsAdmin(isAdminUser);
    setUser(loggedInUser);

    return { user: loggedInUser, isAdmin: isAdminUser };
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    // onAuthStateChanged se encargará de poner user a null y isAdmin a false.
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
