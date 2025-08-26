
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, type User, getIdToken } from "firebase/auth";
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, pass:string) => Promise<{ user: User | null, isAdmin: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const checkIsAdmin = (user: User | null): boolean => {
    if (!user || !user.email) return false;
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
        .split(',')
        .map(email => email.trim().toLowerCase());
    return adminEmails.includes(user.email.toLowerCase());
};

// Function to set a cookie
const setCookie = (name: string, value: string, days: number) => {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

// Function to remove a cookie
const removeCookie = (name: string) => {
    document.cookie = name + '=; Max-Age=-99999999; path=/';  
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      const isAdminStatus = checkIsAdmin(user);
      setIsAdmin(isAdminStatus);
      
      if (user) {
        // When user logs in, get the ID token and set it as a session cookie
        const token = await user.getIdToken();
        const response = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            console.error("Failed to set session cookie");
        }
      } else {
        // When user logs out, clear the session cookie
         await fetch('/api/auth/session', { method: 'DELETE' });
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const loggedInUser = userCredential.user;
    // The onAuthStateChanged listener will handle setting the user, admin status, and cookie
    return { user: loggedInUser, isAdmin: checkIsAdmin(loggedInUser) };
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    // The onAuthStateChanged listener will handle clearing the user, admin status, and cookie
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
