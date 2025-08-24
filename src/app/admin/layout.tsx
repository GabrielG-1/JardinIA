
"use client";

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from '@/components/ui/sidebar';
import { MobileSidebar } from '@/components/layout/mobile-sidebar';
import { UserButton } from '@/components/auth/user-button';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Home, Settings, Image as ImageIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Icons.Logo className="h-12 w-12 animate-pulse text-primary" />
                <p className="text-muted-foreground">Cargando...</p>
            </div>
        </div>
    );
  }

  if (!user) {
    return null; // or a redirect component
  }

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
