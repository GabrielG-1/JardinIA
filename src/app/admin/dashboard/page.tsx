
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { getCatalog, type Category, type Product } from "@/services/catalog-service";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { AlertTriangle, Pencil } from "lucide-react";
import { EditProductDialog } from "@/components/admin/edit-product-dialog";

const formatPrice = (price: string) => {
    // Intenta convertir a número y formatear, si falla, devuelve el string original.
    const number = parseInt(price.replace(/[^0-9]/g, ''), 10);
    if (isNaN(number)) return price;
    return `$${number.toLocaleString('es-CL')}`;
};

function AdminProductList() {
  const [catalogData, setCatalogData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para forzar la recarga de datos. Por ahora, no es necesaria,
  // ya que Firestore nos da actualizaciones en tiempo real.
  const handleProductUpdate = () => {
    // En el futuro, podríamos querer forzar una recarga aquí si no usáramos onSnapshot.
    console.log("Producto actualizado, la lista se refrescará automáticamente.");
  };

  useEffect(() => {
    const unsubscribe = getCatalog(
      (data) => {
        setCatalogData(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("No se pudieron cargar los productos. Revisa la consola para más detalles.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-md mx-auto bg-destructive/10 border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-destructive">
            <AlertTriangle /> Error al Cargar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive/80">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Accordion type="multiple" className="w-full space-y-4">
      {catalogData.map((category) => (
        <AccordionItem key={category.id} value={category.id} className="border rounded-lg bg-card">
          <AccordionTrigger className="text-lg font-semibold hover:no-underline px-6">
            {category.name}
          </AccordionTrigger>
          <AccordionContent className="px-6">
            <div className="divide-y divide-border">
              {category.products.map((product) => (
                <div key={product.id || product.name} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={60}
                      height={60}
                      className="rounded-md object-cover"
                    />
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{formatPrice(product.price)}</p>
                    </div>
                  </div>
                  <EditProductDialog 
                    product={product} 
                    categoryId={category.id}
                    onProductUpdated={handleProductUpdate}
                  />
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export default function AdminDashboardPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/admin');
  };

  return (
    <div className="container mx-auto p-4 md:p-8 bg-muted/20 min-h-screen pt-28">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Panel de Administrador</h1>
          {user && <p className="text-muted-foreground">Sesión iniciada como {user.email}</p>}
        </div>
        <Button onClick={handleSignOut} variant="outline">
          Cerrar Sesión
        </Button>
      </header>
      <main>
        <div className="mb-6">
            <p className="text-muted-foreground">
                Bienvenido al panel de control. Aquí puedes ver y editar los productos de tu tienda.
            </p>
        </div>
        <AdminProductList />
      </main>
    </div>
  );
}
