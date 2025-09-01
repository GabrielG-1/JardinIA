
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

  const isAdmin = useMemo(() => {
    if (!user || !user.email) {
      return false;
    }
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
        .toLowerCase()
        .split(',')
        .filter(email => email.trim() !== '');
    
    return adminEmails.includes(user.email.toLowerCase());
  }, [user]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
        .toLowerCase()
        .split(',')
        .filter(e => e.trim() !== '');
    const adminStatus = adminEmails.includes(userCredential.user.email?.toLowerCase() || "");
    
    return { user: userCredential.user, isAdmin: adminStatus };
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const value = { user, isAdmin, isLoading, signIn, signOut };

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
