
"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskConical, Sprout, Package, Wheat, Leaf, type LucideIcon, AlertTriangle, Wrench, Fence, SprayCan, Flower, Carrot, TestTube, Shirt, Layers } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { getCatalog, type Category } from "@/services/catalog-service";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/catalog/product-card";

const icons: { [key: string]: LucideIcon } = {
  FlaskConical,
  Sprout,
  Package,
  Wheat,
  Leaf,
  Wrench,
  Fence,
  SprayCan,
  Flower,
  Carrot,
  TestTube,
  Shirt,
  Layers,
};

const LoadingSkeleton = () => (
  <div className="w-full max-w-7xl mx-auto space-y-4">
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
    // La lógica de `getCatalog` ahora es un listener en tiempo real.
    // El unsubscribe detiene el listener cuando el componente se desmonta.
    const unsubscribe = getCatalog(
      (data) => {
        setCatalogData(data);
        setLoading(false);
      }, 
      (err) => { 
        console.error(err);
        setError("No se pudieron cargar los productos. Verifique la configuración de Firebase y las reglas de seguridad.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []); // El array vacío asegura que esto solo se ejecute una vez.
  
  const safeCatalog = useMemo(() => Array.isArray(catalogData) ? catalogData : [], [catalogData]);

  const renderContent = () => {
    if (loading) {
        return <LoadingSkeleton />;
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
    
    if (safeCatalog.length === 0) {
        return (
             <Card className="max-w-md mx-auto bg-yellow-50 border-yellow-300">
                <CardHeader>
                    <CardTitle className="flex items-center justify-center gap-2 text-yellow-800">
                        <AlertTriangle /> Catálogo Vacío
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-yellow-700">No se encontraron productos. Agregue la colección 'catalog' a su base de datos de Firestore para comenzar.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Accordion type="multiple" className="w-full max-w-7xl mx-auto">
          {safeCatalog.map((category) => {
            const Icon = icons[category.icon] || FlaskConical;
            const catKey = category.id; // Garantizado por el servicio
            const catValue = String(catKey);

            return (
              <AccordionItem key={catKey} value={catValue} className="border-border bg-background rounded-lg mb-4 shadow-sm">
                <AccordionTrigger className="text-2xl font-headline hover:no-underline px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Icon className="h-8 w-8 text-primary" />
                    {category.name}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pt-4">
                    {Array.isArray(category.products) && category.products.map((product) => (
                      <ProductCard 
                        key={product.id} // Garantizado por el servicio
                        product={product} 
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
          )})}
        </Accordion>
    );
  }

  return (
    <section id="catalogo" className="py-20" style={{ backgroundColor: 'hsl(var(--card))' }}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold font-headline">Nuestro Catálogo</h2>
          <p className="text-muted-foreground mt-2">Explora nuestra selección de productos de alta calidad.</p>
        </div>
        {renderContent()}
      </div>
    </section>
  );
}
