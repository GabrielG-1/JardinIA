
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

// Esta función ahora está fuera del componente para claridad y se asegura de no ejecutarse si no hay usuario.
const checkIsAdmin = (userToCheck: User | null): boolean => {
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
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);


  useEffect(() => {
    // onAuthStateChanged maneja la escucha de cambios de estado de autenticación.
    // Esta es la forma correcta y segura de manejar la autenticación.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Establece el usuario actual (puede ser null)
      
      // LA CORRECCIÓN CLAVE: La verificación de admin solo se ejecuta DESPUÉS
      // de que onAuthStateChanged nos da un usuario definitivo.
      setIsAdmin(checkIsAdmin(currentUser)); 
      
      setIsLoading(false); // La carga ha terminado, ya sea con usuario o sin él.
    });

    // Se desuscribe del listener al desmontar el componente para evitar fugas de memoria.
    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    // onAuthStateChanged se encargará de la actualización del estado global (user, isAdmin).
    // Devolvemos el estado de admin para que el componente de login pueda reaccionar inmediatamente.
    const adminStatus = checkIsAdmin(userCredential.user);
    return { user: userCredential.user, isAdmin: adminStatus };
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    // onAuthStateChanged se encargará de limpiar el estado (user a null, isAdmin a false).
  };

  const value = { user, isAdmin, isLoading, signIn, signOut };

  // Evitamos renderizar el resto de la app hasta que sepamos el estado de auth.
  // Esto previene que componentes hijos intenten acceder a datos protegidos prematuramente.
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
