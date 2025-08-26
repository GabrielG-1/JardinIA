
"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { getCatalog, updateProductImage, type Category, type Product } from "@/services/catalog-service";
import { uploadProductImage } from "@/services/storage-service";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { AlertTriangle, Pencil, Upload } from "lucide-react";
import { EditProductDialog } from "@/components/admin/edit-product-dialog";
import { CreateProductDialog } from "@/components/admin/create-product-dialog";

const formatPrice = (price: string) => {
    const number = parseInt(price.replace(/[^0-9]/g, ''), 10);
    if (isNaN(number)) return price;
    return `$${number.toLocaleString('es-CL')}`;
};

function AdminProductList() {
  const [catalogData, setCatalogData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingProductId, setUploadingProductId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleProductUpdate = () => {
    // La lista se refresca automáticamente gracias al listener de onSnapshot
    console.log("Producto actualizado o creado, la lista se refrescará.");
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, product: Product, categoryId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const productId = product.id || product.name;
    setUploadingProductId(productId);

    try {
      const safeProductName = product.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const downloadURL = await uploadProductImage(file, safeProductName);
      await updateProductImage(categoryId, productId, downloadURL);
      toast({
        title: "Imagen actualizada",
        description: `La imagen de ${product.name} se ha cambiado correctamente.`,
      });
    } catch (error) {
      toast({
        title: "Error al subir la imagen",
        description: "No se pudo subir la imagen. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error("Error uploading image: ", error);
    } finally {
      setUploadingProductId(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

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
    <>
      <div className="mb-6 flex justify-end">
        <CreateProductDialog categories={catalogData} onProductCreated={handleProductUpdate} />
      </div>
      <Accordion type="multiple" className="w-full space-y-4">
        {catalogData.map((category) => (
          <AccordionItem key={category.id} value={category.id} className="border rounded-lg bg-card">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline px-6">
              {category.name}
            </AccordionTrigger>
            <AccordionContent className="px-6">
              <div className="divide-y divide-border">
                {category.products.map((product) => {
                  const isUploading = uploadingProductId === (product.id || product.name);
                  return (
                    <div key={product.id || product.name} className="flex flex-wrap items-center justify-between py-4 gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-[250px]">
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
                      <div className="flex items-center gap-2">
                         <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={(e) => handleImageUpload(e, product, category.id)}
                          />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          {isUploading ? "Subiendo..." : "Cambiar Imagen"}
                        </Button>
                        <EditProductDialog 
                          product={product} 
                          categoryId={category.id}
                          onProductUpdated={handleProductUpdate}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </>
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
        <AdminProductList />
      </main>
    </div>
  );
}
