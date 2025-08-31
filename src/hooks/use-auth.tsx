
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
    // Si no hay usuario, no puede ser admin.
    if (!user) return false;
    
    try {
      // Comprueba si el documento del admin existe en Firestore.
      const adminDocRef = doc(db, 'admins', user.uid);
      const adminDoc = await getDoc(adminDocRef);
      return adminDoc.exists();
    } catch (error) {
      console.error("Error checking admin status:", error);
      // Si hay un error (ej. de permisos momentáneo), asumimos que no es admin por seguridad.
      return false;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      // Solo si Firebase confirma un usuario, verificamos si es admin.
      if (user) {
        const adminStatus = await checkIsAdmin(user);
        setUser(user);
        setIsAdmin(adminStatus);
      } else {
        // Si no hay usuario, reseteamos el estado.
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
    
    // Después de un inicio de sesión exitoso, onAuthStateChanged se disparará
    // y manejará la actualización del estado del usuario y de administrador,
    // pero para una respuesta inmediata en la UI, podemos comprobarlo aquí también.
    const adminStatus = await checkIsAdmin(loggedInUser);

    // No actualizamos el estado global aquí para evitar condiciones de carrera,
    // `onAuthStateChanged` es la única fuente de verdad para el estado global.
    // Devolvemos el estado para que la página de login pueda reaccionar inmediatamente.
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
