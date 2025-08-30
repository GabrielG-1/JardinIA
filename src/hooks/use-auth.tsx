
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

/**
 * Parses the admin emails string from environment variables into a clean, lowercase array.
 * This is used as a fallback/secondary check for the UI.
 * @returns An array of admin emails, ready for comparison.
 */
const getAdminEmails = (): string[] => {
    const emailsString = process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
    return emailsString
        .split(',')
        .map(email => email.trim().toLowerCase())
        .filter(Boolean); // Removes any empty strings that might result from trailing commas
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const adminEmails = getAdminEmails();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user?.email) {
        // **LA CORRECCIÓN CLAVE**: Forzar la recarga del token para obtener los claims más recientes.
        // El `true` le dice a Firebase: "ignora la caché, dame un token nuevo del servidor".
        const idTokenResult = await user.getIdTokenResult(true); 
        const hasAdminClaim = !!idTokenResult.claims.admin;
        
        // Para la UI, se mantiene la verificación local como un fallback visual inmediato.
        // La verdadera seguridad está en el backend (firestore.rules) que SIEMPRE usa el token actualizado.
        const isEmailInClientList = adminEmails.includes(user.email.toLowerCase());
        
        // Un usuario es admin si tiene el claim O está en la lista del cliente.
        setIsAdmin(hasAdminClaim || isEmailInClientList);

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
    
    // **LA CORRECCIÓN CLAVE (también en el login)**: Forzar la actualización del token 
    // inmediatamente después del login para obtener los claims más recientes.
    const idTokenResult = await loggedInUser.getIdTokenResult(true);
    const hasAdminClaim = !!idTokenResult.claims.admin;

    const adminEmails = getAdminEmails();
    const isEmailInClientList = loggedInUser.email ? adminEmails.includes(loggedInUser.email.toLowerCase()) : false;
    
    const finalIsAdmin = hasAdminClaim || isEmailInClientList;

    setIsAdmin(finalIsAdmin);
    setUser(loggedInUser);

    return { user: loggedInUser, isAdmin: finalIsAdmin };
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    // El listener onAuthStateChanged se encargará de poner user a null y isAdmin a false.
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
