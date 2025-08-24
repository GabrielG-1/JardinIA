
"use client";

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from '@/components/ui/sidebar';
import { MobileSidebar } from '@/components/layout/mobile-sidebar';
import { UserButton } from '@/components/auth/user-button';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Home, Settings, Image as ImageIcon, ShieldAlert } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Lee la lista de correos de administradores desde las variables de entorno.
// Esto es más seguro que tenerlos en el código.
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(',');

function NotAuthorized() {
    const router = useRouter();
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <ShieldAlert className="h-8 w-8 text-destructive" />
                    </div>
                    <CardTitle className="mt-4">Acceso Denegado</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        No tienes permiso para acceder a esta página.
                    </p>
                    <Button onClick={() => router.push('/')} className="mt-6">
                        Volver a la Tienda
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, loading, error] = useAuthState(auth);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (loading) {
      // Si está cargando, no hacemos nada todavía.
      setIsAuthorized(null);
      return;
    }
    
    if (!user) {
      // Si no hay usuario y no está cargando, redirige a la página de login.
      router.push('/auth');
      return;
    }

    // Comprueba si el email del usuario está en la lista de administradores.
    const userIsAdmin = ADMIN_EMAILS.includes(user.email || '');
    
    if (userIsAdmin) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
      // Opcional: notificar al usuario que no tiene permisos.
      toast({
        title: 'Acceso Denegado',
        description: 'No tienes permisos para acceder a esta sección.',
        variant: 'destructive',
      });
    }

  }, [user, loading, router, toast]);

  if (loading || isAuthorized === null) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Icons.Logo className="h-12 w-12 animate-pulse text-primary" />
                <p className="text-muted-foreground">Verificando permisos...</p>
            </div>
        </div>
    );
  }

  if (!isAuthorized) {
    // Muestra una página o componente de "No Autorizado".
    return <NotAuthorized />;
  }

  // Si el usuario está autorizado, renderiza el layout del admin.
  return (
    <div className="flex">
        <Sidebar>
            <SidebarHeader>
                 <Button variant="ghost" className="h-10 w-full justify-start px-2 text-xl font-bold">
                    <Icons.Logo className="mr-2 h-6 w-6" />
                    <span>JardínIA</span>
                </Button>
            </SidebarHeader>
            <SidebarContent>
                 <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton href="/admin" isActive>
                            <ImageIcon />
                            Gestión de Imágenes
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton href="/" >
                            <Home />
                            Volver a la Tienda
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
             <div className="mt-auto flex w-full justify-start p-2">
                <UserButton />
            </div>
        </Sidebar>

      <main className="flex-1">
        <header className="flex h-14 items-center justify-between border-b bg-background px-4 lg:justify-end">
          <MobileSidebar>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <SidebarTrigger />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
          </MobileSidebar>
           <div className="hidden lg:block">
             <UserButton />
            </div>
        </header>
        {children}
      </main>
    </div>
  );
}
