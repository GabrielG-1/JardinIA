"use client";

import { useEffect } from "react";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import { usePathname, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // Si el usuario ya ha iniciado sesión como administrador, lo llevamos al dashboard.
    if (user && isAdmin && pathname === '/admin') {
      router.replace("/admin/dashboard");
    }
    
    // Si el usuario no es admin e intenta acceder a una ruta protegida (que no sea el login),
    // lo devolvemos a la página de login.
    if (!isAdmin && pathname !== '/admin') {
      router.replace("/admin");
    }

  }, [user, isAdmin, isLoading, router, pathname]);

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
  
  // Si el usuario es admin y está en una página de admin, o si no está logueado y está en la página de login,
  // mostramos el contenido.
  if ((user && isAdmin) || (!user && pathname === '/admin')) {
    return <>{children}</>;
  }

  // En cualquier otro caso (ej. no es admin pero intenta acceder a /admin), no se muestra nada
  // mientras la redirección del useEffect hace su trabajo.
  return null;
}


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AuthProvider>
  );
}
