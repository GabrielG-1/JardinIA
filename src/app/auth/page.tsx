"use client";

import { useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.83 0-5.22-1.9-6.08-4.44H2.31v2.84C4.22 20.98 7.82 23 12 23z"/>
    <path fill="#FBBC05" d="M5.92 14.41C5.63 13.62 5.48 12.82 5.48 12s.15-1.62.43-2.41V6.76H2.31C1.45 8.55 1 10.22 1 12s.45 3.45 1.31 5.24l3.61-2.83z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.82 1 4.22 3.02 2.31 6.76l3.61 2.83C6.78 7.28 9.17 5.38 12 5.38z"/>
  </svg>
);


export default function AuthPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/admin');
    }
  }, [user, router]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error during sign in", error);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }
  
  if(user) return null;


  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <Icons.Logo className="h-12 w-12 text-primary"/>
            </div>
          <CardTitle>Acceso de Administrador</CardTitle>
          <CardDescription>Inicia sesión para gestionar el contenido de JardínIA.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={signInWithGoogle} className="w-full">
            <GoogleIcon />
            Iniciar Sesión con Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
