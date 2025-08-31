
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

const getAdminEmails = (): string[] => {
    const emails = process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
    return emails.split(',').map(email => email.trim().toLowerCase());
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkIsAdmin = useCallback((user: User | null): boolean => {
      if (!user || !user.email) return false;
      const adminEmails = getAdminEmails();
      const isAdminStatus = adminEmails.includes(user.email.toLowerCase());
      console.log(`Verificando admin para ${user.email}. Lista de admins: [${adminEmails.join(', ')}]. Es admin: ${isAdminStatus}`);
      return isAdminStatus;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoading(true);
      if (user) {
        setUser(user);
        setIsAdmin(checkIsAdmin(user));
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [checkIsAdmin]);

  const signIn = async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const loggedInUser = userCredential.user;
    const adminStatus = checkIsAdmin(loggedInUser);
    
    // El listener onAuthStateChanged se encargará de actualizar el estado,
    // pero devolvemos el estado calculado para una respuesta inmediata en la UI.
    return { user: loggedInUser, isAdmin: adminStatus };
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    // El listener onAuthStateChanged se encargará de limpiar el estado.
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
