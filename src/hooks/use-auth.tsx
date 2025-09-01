
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
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

  // Derivamos el estado de isAdmin del usuario.
  // Usamos useMemo para que no se recalcule en cada render, solo si cambia el usuario.
  const isAdmin = useMemo(() => {
    // Si no hay usuario o no tiene email, no puede ser admin.
    if (!user || !user.email) {
      return false;
    }
    
    // Obtiene la lista de correos de administradores de la variable de entorno.
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
        .toLowerCase()
        .split(',')
        .filter(email => email.trim() !== ''); // Filtra correos vacíos
    
    return adminEmails.includes(user.email.toLowerCase());
  }, [user]); // La dependencia es el objeto 'user'


  useEffect(() => {
    // onAuthStateChanged maneja la escucha de cambios de estado de autenticación.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Establece el usuario actual (puede ser null)
      setIsLoading(false); // La carga ha terminado, ya sea con usuario o sin él.
    });

    // Se desuscribe del listener al desmontar el componente para evitar fugas de memoria.
    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    // onAuthStateChanged se encargará de la actualización del estado global (user).
    
    // Calculamos el estado de admin aquí para devolverlo inmediatamente al componente de login.
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
        .toLowerCase()
        .split(',')
        .filter(e => e.trim() !== '');
    const adminStatus = adminEmails.includes(userCredential.user.email?.toLowerCase() || "");
    
    return { user: userCredential.user, isAdmin: adminStatus };
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    // onAuthStateChanged se encargará de limpiar el estado (user a null).
  };

  const value = { user, isAdmin, isLoading, signIn, signOut };

  // Evitamos renderizar el resto de la app hasta que sepamos el estado de auth.
  if (isLoading) {
      return (
         <div className="flex h-screen w-full items-center justify-center bg-background">
             <div className="flex flex-col items-center gap-4">
                <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-muted-foreground">Inicializando...</p>
             </div>
        </div>
      )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
