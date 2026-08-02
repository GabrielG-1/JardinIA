
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
            <svg width="100%" viewBox="0 0 680 130" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 32 C80 42, 160 36, 240 44 C320 52, 400 38, 480 46 C560 54, 630 40, 680 36" stroke="#b5956a" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.9"/>
              <path d="M0 34 C80 44, 160 38, 240 46 C320 54, 400 40, 480 48 C560 56, 630 42, 680 38" stroke="#d4b896" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.4"/>
              <line x1="160" y1="40" x2="160" y2="58" stroke="#9a7a50" strokeWidth="0.9" opacity="0.8"/>
              <g transform="translate(160, 58)">
                <path d="M0 0 C-9 8, -11 22, 0 30 C11 22, 9 8, 0 0Z" fill="#4a7a38" stroke="#3a6028" strokeWidth="0.8"/>
                <line x1="0" y1="2" x2="0" y2="28" stroke="#3a6028" strokeWidth="0.6" opacity="0.6"/>
                <path d="M0 10 C-5 12, -8 14, -9 16" fill="none" stroke="#3a6028" strokeWidth="0.5" opacity="0.5"/>
                <path d="M0 10 C5 12, 8 14, 9 16" fill="none" stroke="#3a6028" strokeWidth="0.5" opacity="0.5"/>
                <path d="M0 18 C-5 20, -7 22, -8 24" fill="none" stroke="#3a6028" strokeWidth="0.4" opacity="0.4"/>
                <path d="M0 18 C5 20, 7 22, 8 24" fill="none" stroke="#3a6028" strokeWidth="0.4" opacity="0.4"/>
              </g>
              <line x1="340" y1="44" x2="340" y2="60" stroke="#9a7a50" strokeWidth="0.9" opacity="0.8"/>
              <g transform="translate(340, 60)">
                <ellipse cx="0" cy="0" rx="11" ry="3.5" fill="#5a8a3a" opacity="0.85"/>
                <path d="M-3 0 C-5 -8, -8 -14, -5 -20" fill="none" stroke="#2d6a1a" strokeWidth="1.4" strokeLinecap="round"/>
                <path d="M3 0 C5 -8, 8 -14, 5 -20" fill="none" stroke="#2d6a1a" strokeWidth="1.4" strokeLinecap="round"/>
                <path d="M-5 -20 C-12 -26, -16 -20, -10 -16" fill="#5aaa38" stroke="#3a8028" strokeWidth="0.7"/>
                <path d="M5 -20 C12 -26, 16 -20, 10 -16" fill="#5aaa38" stroke="#3a8028" strokeWidth="0.7"/>
                <path d="M-12 0 L-9 18 L9 18 L12 0Z" fill="#c8703a" stroke="#a85828" strokeWidth="0.9"/>
                <rect x="-13" y="-2" width="26" height="5" rx="1" fill="#d4844a" stroke="#a85828" strokeWidth="0.7"/>
                <line x1="-9" y1="6" x2="9" y2="6" stroke="#a85828" strokeWidth="0.5" opacity="0.5"/>
              </g>
              <line x1="520" y1="41" x2="520" y2="58" stroke="#9a7a50" strokeWidth="0.9" opacity="0.8"/>
              <g transform="translate(520, 58)">
                <rect x="-2.5" y="0" width="5" height="22" rx="2" fill="#c8a060" stroke="#a07840" strokeWidth="0.7"/>
                <rect x="-3.5" y="18" width="7" height="4" rx="1" fill="#888878" stroke="#666658" strokeWidth="0.6"/>
                <path d="M-8 22 L8 22 L4 42 Q0 48 -4 42 Z" fill="#b0b0a0" stroke="#808070" strokeWidth="0.9"/>
                <path d="M-2 24 L0 24 L-2 40" fill="none" stroke="#d0d0c0" strokeWidth="0.8" opacity="0.6"/>
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
