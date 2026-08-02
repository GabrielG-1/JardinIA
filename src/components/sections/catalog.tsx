
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
            <svg width="100%" viewBox="0 0 680 110" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 28 C80 38, 160 32, 240 40 C320 48, 400 34, 480 42 C560 50, 620 36, 680 32" stroke="#b5956a" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85"/>
              <path d="M0 30 C80 40, 160 34, 240 42 C320 50, 400 36, 480 44 C560 52, 620 38, 680 34" stroke="#d4b896" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.45"/>

              {/* Hilo hoja */}
              <line x1="150" y1="36" x2="150" y2="58" stroke="#b5956a" strokeWidth="0.9" opacity="0.7"/>
              <g transform="translate(150, 58)">
                <path d="M0 0 C-9 -10, -12 -24, 0 -32 C12 -24, 9 -10, 0 0Z" fill="#4a7a38" stroke="#3a6028" strokeWidth="0.8"/>
                <line x1="0" y1="-2" x2="0" y2="-30" stroke="#3a6028" strokeWidth="0.6" opacity="0.6"/>
                <path d="M-5 -16 C-1 -14, 3 -15, 6 -16" fill="none" stroke="#3a6028" strokeWidth="0.5" opacity="0.5"/>
              </g>

              {/* Hilo maceta */}
              <line x1="340" y1="40" x2="340" y2="60" stroke="#b5956a" strokeWidth="0.9" opacity="0.7"/>
              <g transform="translate(340, 60)">
                <path d="M-4 -34 C-5 -28, -8 -22, -8 -18" fill="none" stroke="#3a7028" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M-8 -18 C-14 -24, -18 -20, -14 -14" fill="#5aaa38" stroke="#3a7028" strokeWidth="0.7"/>
                <path d="M4 -34 C5 -28, 8 -22, 8 -18" fill="none" stroke="#3a7028" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M8 -18 C14 -24, 18 -20, 14 -14" fill="#5aaa38" stroke="#3a7028" strokeWidth="0.7"/>
                <ellipse cx="0" cy="-16" rx="9" ry="3" fill="#6aaa48" opacity="0.7"/>
                <path d="M-10 -16 L-8 0 L8 0 L10 -16 Z" fill="#c8703a" stroke="#a85828" strokeWidth="0.8"/>
                <line x1="-11" y1="-12" x2="11" y2="-12" stroke="#a85828" strokeWidth="1" opacity="0.7"/>
              </g>

              {/* Hilo palita */}
              <line x1="530" y1="38" x2="530" y2="58" stroke="#b5956a" strokeWidth="0.9" opacity="0.7"/>
              <g transform="translate(530, 58)">
                <line x1="0" y1="0" x2="0" y2="-22" stroke="#8a7a5a" strokeWidth="3" strokeLinecap="round"/>
                <path d="M-1 -4 L1 -4 L1 0 L-1 0Z" fill="#6a5a3a" stroke="#5a4a2a" strokeWidth="0.5"/>
                <path d="M0 -22 C-6 -26, -9 -34, -4 -40 C-1 -43, 1 -43, 4 -40 C9 -34, 6 -26, 0 -22Z" fill="#b0b0a0" stroke="#808070" strokeWidth="1"/>
                <line x1="-5" y1="-32" x2="5" y2="-28" stroke="#808070" strokeWidth="0.5" opacity="0.5"/>
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
