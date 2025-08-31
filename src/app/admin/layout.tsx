
"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePathname, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // No hacer nada mientras se carga el estado de autenticación
    if (isLoading) {
      return; 
    }

    const isAuthPage = pathname === '/admin';
    const isDashboard = pathname.startsWith('/admin/dashboard');

    // Si el usuario es administrador...
    if (user && isAdmin) {
      // Y está en la página de login, lo redirigimos al dashboard
      if (isAuthPage) {
        router.replace('/admin/dashboard');
      }
    } 
    // Si el usuario no es administrador (o no está logueado)...
    else {
      // Y está intentando acceder a cualquier página de admin que no sea el login, lo devolvemos
      if (!isAuthPage) {
        router.replace('/admin');
      }
    }
    
  }, [user, isAdmin, isLoading, router, pathname]);

  // Muestra un esqueleto de carga mientras se determina el estado de auth
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
         <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-8 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
         </div>
      </div>
    );
  }

  // Si no está cargando, simplemente renderiza el contenido de la página actual
  return <>{children}</>;
}


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <AdminLayoutContent>{children}</AdminLayoutContent>
  );
}
