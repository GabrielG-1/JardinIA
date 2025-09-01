
"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePathname, useRouter } from "next/navigation";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // La pantalla de carga principal en AuthProvider maneja el estado inicial.
    // Cuando este componente se renderiza, isLoading ya debería ser false.
    // Si por alguna razón todavía está cargando, no hacemos nada.
    if (isLoading) {
      return;
    }

    const isAuthPage = pathname === '/admin';
    
    // Si hay un usuario y es admin, lo dejamos en paz a menos que esté en
    // la página de login, en cuyo caso lo mandamos al dashboard.
    if (user && isAdmin) {
      if (isAuthPage) {
        router.replace('/admin/dashboard');
      }
      return;
    }

    // Si no es admin (o no está logueado) y no está en la página de login,
    // lo redirigimos a la página de login.
    if (!isAuthPage) {
        router.replace('/admin');
    }

  }, [user, isAdmin, isLoading, router, pathname]);

  // isLoading ya es manejado por el AuthProvider, por lo que aquí simplemente
  // renderizamos los hijos, y el useEffect se encargará de la redirección.
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
