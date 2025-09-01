
"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePathname, useRouter } from "next/navigation";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) {
      return; // Espera a que el AuthProvider termine de cargar.
    }

    const isAuthPage = pathname === '/admin';
    
    if (user && isAdmin) {
      if (isAuthPage) {
        router.replace('/admin/dashboard');
      }
      return;
    }

    if (!user && !isAuthPage) {
      router.replace('/admin');
    }
    
    if(user && !isAdmin){
        router.replace('/');
    }

  }, [user, isAdmin, isLoading, router, pathname]);

  // Muestra una pantalla de carga si la autenticación aún está en proceso.
  // Esto es crucial para prevenir que los componentes hijos intenten leer datos
  // antes de que los permisos de administrador estén confirmados.
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Una vez cargado, el useEffect se encarga de la redirección.
  // Renderizamos los hijos para que las páginas de login o dashboard se muestren.
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
