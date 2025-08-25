"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/admin');
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold font-headline">Panel de Administrador</h1>
            {user && <p className="text-muted-foreground">Sesión iniciada como {user.email}</p>}
        </div>
        <Button onClick={handleSignOut} variant="outline">
            Cerrar Sesión
        </Button>
      </header>
      <main>
        <p>Bienvenido al panel de control. Aquí podrás gestionar los productos de la tienda.</p>
        <div className="mt-8 p-8 border-2 border-dashed rounded-lg text-center">
            <p className="text-muted-foreground">Fase 2: El listado de productos aparecerá aquí.</p>
        </div>
      </main>
    </div>
  );
}
