
"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { FlaskConical, Sprout, Package, Wheat, Leaf, type LucideIcon, Upload, AlertTriangle } from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import { uploadProductImage } from "@/services/storage-service";
import { useToast } from "@/hooks/use-toast";
import { getCatalog, updateCategoryProducts, type Category, type Product } from "@/services/catalog-service";
import { Skeleton } from "@/components/ui/skeleton";

const icons: { [key: string]: LucideIcon } = {
  FlaskConical,
  Sprout,
  Package,
  Wheat,
  Leaf,
};

function ProductCard({ 
  product, 
  categoryId,
  onImageChange 
}: { 
  product: Product, 
  categoryId: string,
  onImageChange: (productName: string, newImageUrl: string) => Promise<void> 
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const downloadURL = await uploadProductImage(file, product.name);
        await onImageChange(product.name, downloadURL);
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
        setIsUploading(false);
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="flex flex-col transition-all duration-300 hover:shadow-lg hover:scale-105 bg-background group/product">
      <CardHeader className="p-0 relative">
        <Image
          src={product.image}
          alt={product.name}
          width={200}
          height={200}
          className="rounded-t-lg object-cover w-full aspect-square"
          {...(product.aiHint && { "data-ai-hint": product.aiHint })}
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/product:opacity-100 transition-opacity flex items-center justify-center">
            <Button onClick={handleButtonClick} disabled={isUploading}>
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? "Subiendo..." : "Cambiar Imagen"}
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleImageUpload}
            />
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <CardTitle className="text-lg font-semibold">{product.name}</CardTitle>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <p className="text-xl font-bold text-primary">{product.price}</p>
        <Button>Añadir</Button>
      </CardFooter>
    </Card>
  );
}

const LoadingSkeleton = () => (
  <div className="w-full max-w-6xl mx-auto space-y-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <Card key={i} className="border-border bg-background rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-1/4" />
        </div>
      </Card>
    ))}
  </div>
);


export function CatalogSection() {
  const [catalogData, setCatalogData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const unsubscribe = getCatalog((data) => {
        setCatalogData(data);
        setLoading(false);
        if(data.length === 0){
          setError("No se encontraron productos. Agregue la colección 'catalog' a su base de datos de Firestore para comenzar.");
        }
      });
      return () => unsubscribe();
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los productos. Verifique la configuración de Firebase y las reglas de seguridad.");
      setLoading(false);
    }
  }, []);

  const handleImageChange = async (categoryId: string, productName: string, newImageUrl: string) => {
    const category = catalogData.find(c => c.id === categoryId);
    if (!category) return;

    const updatedProducts = category.products.map(product => {
      if (product.name === productName) {
        return { ...product, image: newImageUrl };
      }
      return product;
    });
    
    // Optimistic UI update
    setCatalogData(prevData =>
      prevData.map(c => 
        c.id === categoryId ? { ...c, products: updatedProducts } : c
      )
    );

    // Persist to Firestore
    try {
      await updateCategoryProducts(categoryId, updatedProducts);
    } catch (e) {
        // Revert UI change on error
        setCatalogData(prevData =>
            prevData.map(c => 
                c.id === categoryId ? category : c
            )
        );
        toast({
            title: "Error al guardar la imagen",
            description: "No se pudo guardar la imagen en la base de datos.",
            variant: "destructive"
        })
    }
  };
  
  const { toast } = useToast();

  if (loading) {
    return (
        <section id="catalogo" className="py-20" style={{ backgroundColor: 'hsl(var(--card))' }}>
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                <h2 className="text-4xl font-bold font-headline">Nuestro Catálogo</h2>
                <p className="text-muted-foreground mt-2">Explora nuestra selección de productos de alta calidad.</p>
                </div>
                <LoadingSkeleton />
            </div>
        </section>
    )
  }

  if (error) {
    return (
        <section id="catalogo" className="py-20" style={{ backgroundColor: 'hsl(var(--card))' }}>
            <div className="container mx-auto px-4 text-center">
                 <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold font-headline">Nuestro Catálogo</h2>
                 </div>
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
            </div>
        </section>
    )
  }

  return (
    <section id="catalogo" className="py-20" style={{ backgroundColor: 'hsl(var(--card))' }}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold font-headline">Nuestro Catálogo</h2>
          <p className="text-muted-foreground mt-2">Explora nuestra selección de productos de alta calidad.</p>
        </div>
        <Accordion type="multiple" className="w-full max-w-6xl mx-auto" defaultValue={catalogData.map((c) => c.id)}>
          {catalogData.map((category) => {
            const Icon = icons[category.icon] || FlaskConical;
            return (
            <AccordionItem key={category.id} value={category.id} className="border-border bg-background rounded-lg mb-4 shadow-sm">
              <AccordionTrigger className="text-2xl font-headline hover:no-underline px-6 py-4">
                <div className="flex items-center gap-3">
                  <Icon className="h-8 w-8 text-primary" />
                  {category.name}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                  {Array.isArray(category.products) && category.products.map((product) => (
                    <ProductCard 
                      key={product.name} 
                      product={product} 
                      categoryId={category.id}
                      onImageChange={(productName, newImageUrl) => handleImageChange(category.id, productName, newImageUrl)}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )})}
        </Accordion>
      </div>
    </section>
  );
}
