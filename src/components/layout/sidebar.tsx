"use client";

import React, { ReactNode } from 'react';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from '@/components/ui/sidebar';
import { MobileSidebar } from '@/components/layout/mobile-sidebar';
import { UserButton } from '@/components/auth/user-button';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Home, Settings, Image as ImageIcon } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLink {
    href: string;
    icon: React.ReactNode;
    label: string;
    adminOnly?: boolean;
}

export function AppSidebar({ children }: { children: ReactNode }) {
    const [user, loading] = useAuthState(auth);
    const pathname = usePathname();

    const navLinks: NavLink[] = [
        { href: '/', icon: <Home />, label: 'Inicio' },
        { href: '/admin', icon: <ImageIcon />, label: 'Gestión de Imágenes', adminOnly: true },
    ];
    
    return (
         <div className="flex">
            <Sidebar>
                <SidebarHeader>
                     <Button variant="ghost" asChild className="h-10 w-full justify-start px-2 text-xl font-bold">
                        <Link href="/">
                            <Icons.Logo className="mr-2 h-6 w-6" />
                            <span>JardínIA</span>
                        </Link>
                    </Button>
                </SidebarHeader>
                <SidebarContent>
                     <SidebarMenu>
                         {navLinks.map((link) => {
                            if (link.adminOnly && !user) return null;
                            const isActive = pathname === link.href;
                            return (
                                <SidebarMenuItem key={link.href}>
                                    <SidebarMenuButton asChild isActive={isActive}>
                                        <Link href={link.href}>
                                            {link.icon}
                                            {link.label}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )
                         })}
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
                 {user ? <UserButton /> : <Button asChild><Link href="/auth">Iniciar Sesión</Link></Button>}
                </div>
            </header>
            {children}
          </main>
        </div>
    )
}
