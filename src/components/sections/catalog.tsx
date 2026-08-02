
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
    const fetchCatalog = async () => {
        try {
            const data = await getCatalog();
            setCatalogData(data);
        } catch (err) {
            console.error(err);
            setError("No se pudieron cargar los productos. Verifique la configuración de Firebase y las reglas de seguridad.");
        } finally {
            setLoading(false);
        }
    };
    
    fetchCatalog();
  }, []);
  
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
          {/* Guirnalda decorativa */}
          <div className="relative w-full overflow-hidden" style={{ height: '110px' }}>
            <svg width="100%" viewBox="0 0 1200 110" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
              {/* Cuerda */}
              <path d="M0 30 C100 42, 200 36, 300 44 C400 52, 500 38, 600 46 C700 54, 800 38, 900 45 C1000 52, 1100 38, 1200 34" stroke="#b5956a" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.85"/>
              <path d="M0 32 C100 44, 200 38, 300 46 C400 54, 500 40, 600 48 C700 56, 800 40, 900 47 C1000 54, 1100 40, 1200 36" stroke="#d4b896" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.5"/>

              {/* Hilo hoja - posición 22% */}
              <line x1="264" y1="40" x2="264" y2="68" stroke="#b5956a" strokeWidth="1" opacity="0.7"/>
              {/* Hoja */}
              <g transform="translate(264, 68)" opacity="0.9">
                <path d="M0 0 C-10 -12, -14 -28, 0 -38 C14 -28, 10 -12, 0 0Z" fill="#4a7a38" stroke="#3a6028" strokeWidth="0.8"/>
                <line x1="0" y1="0" x2="0" y2="-36" stroke="#3a6028" strokeWidth="0.7" opacity="0.6"/>
                <path d="M-6 -18 C0 -16, 6 -18, 0 -18" fill="none" stroke="#3a6028" strokeWidth="0.6" opacity="0.5"/>
              </g>

              {/* Hilo maceta - posición 50% */}
              <line x1="600" y1="44" x2="600" y2="68" stroke="#b5956a" strokeWidth="1" opacity="0.7"/>
              {/* Maceta con planta */}
              <g transform="translate(600, 68)" opacity="0.9">
                {/* Tierra */}
                <ellipse cx="0" cy="-22" rx="10" ry="4" fill="#5a8a3a" opacity="0.8"/>
                {/* Plantita */}
                <path d="M0 -22 C-6 -30, -10 -38, -4 -44" fill="none" stroke="#3a7028" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M-4 -44 C-10 -50, -16 -46, -12 -40" fill="#5aaa38" stroke="#3a7028" strokeWidth="0.8"/>
                <path d="M0 -22 C6 -30, 10 -38, 4 -44" fill="none" stroke="#3a7028" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M4 -44 C10 -50, 16 -46, 12 -40" fill="#5aaa38" stroke="#3a7028" strokeWidth="0.8"/>
                {/* Maceta */}
                <path d="M-12 -22 L-10 0 L10 0 L12 -22 Z" fill="#c8703a" stroke="#a85828" strokeWidth="0.8"/>
                <line x1="-13" y1="-18" x2="13" y2="-18" stroke="#a85828" strokeWidth="1.2" opacity="0.7"/>
              </g>

              {/* Hilo palita - posición 78% */}
              <line x1="936" y1="43" x2="936" y2="68" stroke="#b5956a" strokeWidth="1" opacity="0.7"/>
              {/* Palita */}
              <g transform="translate(936, 68)" opacity="0.9">
                <line x1="0" y1="0" x2="0" y2="-18" stroke="#8a8a7a" strokeWidth="2.5" strokeLinecap="round"/>
                <ellipse cx="0" cy="-10" rx="3" ry="2" fill="#6a6a5a" opacity="0.4"/>
                <rect x="-2" y="-3" width="4" height="5" rx="1" fill="#7a7a6a" stroke="#5a5a4a" strokeWidth="0.5"/>
                <path d="M0 -18 C-7 -22, -9 -32, -4 -38 C0 -42, 4 -42, 8 -38 C13 -32, 7 -22, 0 -18Z" fill="#a0a090" stroke="#7a7a6a" strokeWidth="0.8"/>
              </g>
            </svg>
          </div>

          <h2 className="text-4xl font-bold font-headline mt-2">Nuestro Catálogo</h2>
          <p className="text-muted-foreground mt-2">Explora nuestra selección de productos de alta calidad.</p>
        </div>
        {renderContent()}
      </div>
    </section>
  );
}
