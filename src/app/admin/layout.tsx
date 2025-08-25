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
    if (!isLoading) {
      // Si el usuario no está logueado o no es admin, y no está en la página de login
      if ((!user || !isAdmin) && pathname !== '/admin') {
        router.replace("/admin");
      }
      // Si el usuario está logueado y es admin, pero está en la página de login
      else if (user && isAdmin && pathname === '/admin') {
        router.replace("/admin/dashboard");
      }
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
  
  // Si el usuario no está logueado y está en la página de login, muestra la página de login.
  if (!user && pathname === '/admin') {
    return <>{children}</>;
  }

  // Si el usuario es admin, muestra el contenido del dashboard.
  if (user && isAdmin) {
    return <>{children}</>;
  }

  // En cualquier otro caso, no muestres nada mientras se redirige.
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
