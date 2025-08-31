

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
    // No hacer nada mientras carga.
    if (isLoading) return;

    // Si el usuario ha iniciado sesión y es administrador, pero está en la página de login, llévalo al dashboard.
    if (user && isAdmin && pathname === '/admin') {
      router.replace("/admin/dashboard");
      return; // Detener ejecución para evitar otras comprobaciones.
    }
    
    // Si no es admin pero intenta acceder a una ruta protegida (que no es la de login),
    // lo devolvemos a la página de login.
    if (!user && !isAdmin && pathname.startsWith('/admin/') && pathname !== '/admin') {
      router.replace("/admin");
      return; // Detener ejecución.
    }
    
    // Si el usuario está logueado pero no es admin, y trata de ir al dashboard, lo mandamos al login.
    if(user && !isAdmin && pathname.startsWith('/admin/dashboard')) {
      router.replace("/admin");
      return;
    }


  }, [user, isAdmin, isLoading, router, pathname]);

  // Mientras carga, mostrar el esqueleto.
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
  
  // Si no está cargando, y después de las redirecciones, mostrar siempre el contenido.
  // Esto asegura que /admin (login) siempre se muestre si el usuario no es admin.
  // También muestra /admin/dashboard si el usuario es admin.
  // La lógica del useEffect se encarga de las redirecciones incorrectas.
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
