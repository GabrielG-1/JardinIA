
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
        <div className="relative w-full overflow-hidden" style={{ height: '140px' }}>
            <svg width="100%" height="140" viewBox="0 0 1920 140" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              {/* Cuerda */}
              <path d="M0 28 C240 42, 480 30, 720 40 C960 50, 1200 32, 1440 42 C1680 52, 1800 36, 1920 30" stroke="#b5956a" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.9"/>
              <path d="M0 31 C240 45, 480 33, 720 43 C960 53, 1200 35, 1440 45 C1680 55, 1800 39, 1920 33" stroke="#d4b896" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.4"/>

              {/* HOJA */}
              <line x1="441" y1="36" x2="441" y2="56" stroke="#9a7a50" strokeWidth="2.5" opacity="0.8"/>
              <g transform="translate(441, 56)">
                <line x1="0" y1="0" x2="0" y2="10" stroke="#4a7028" strokeWidth="3.5" strokeLinecap="round"/>
                <path d="M0 10 C-24 12, -28 32, 0 52 C28 32, 24 12, 0 10Z" fill="#4a8a38" stroke="#3a6028" strokeWidth="2"/>
                <line x1="0" y1="13" x2="0" y2="50" stroke="#3a6028" strokeWidth="1.5" opacity="0.6"/>
                <path d="M0 25 C-12 29, -19 35, -22 40" fill="none" stroke="#3a6028" strokeWidth="1.2" opacity="0.5"/>
                <path d="M0 25 C12 29, 19 35, 22 40" fill="none" stroke="#3a6028" strokeWidth="1.2" opacity="0.5"/>
                <path d="M0 38 C-8 42, -13 46, -15 50" fill="none" stroke="#3a6028" strokeWidth="1" opacity="0.4"/>
                <path d="M0 38 C8 42, 13 46, 15 50" fill="none" stroke="#3a6028" strokeWidth="1" opacity="0.4"/>
              </g>

              {/* MACETA CON PLANTA */}
              <line x1="960" y1="43" x2="960" y2="62" stroke="#9a7a50" strokeWidth="2.5" opacity="0.8"/>
              <g transform="translate(960, 62)">
                <path d="M-8 0 C-10 -18, -16 -34, -12 -48" fill="none" stroke="#2d6a1a" strokeWidth="3" strokeLinecap="round"/>
                <path d="M8 0 C10 -18, 16 -34, 12 -48" fill="none" stroke="#2d6a1a" strokeWidth="3" strokeLinecap="round"/>
                <path d="M-12 -48 C-26 -60, -36 -48, -24 -38" fill="#5aaa38" stroke="#3a8028" strokeWidth="1.5"/>
                <path d="M12 -48 C26 -60, 36 -48, 24 -38" fill="#5aaa38" stroke="#3a8028" strokeWidth="1.5"/>
                <ellipse cx="0" cy="0" rx="26" ry="8" fill="#5a8a3a" opacity="0.85"/>
                <path d="M-28 0 L-22 40 L22 40 L28 0Z" fill="#c8703a" stroke="#a85828" strokeWidth="2"/>
                <rect x="-30" y="-7" width="60" height="11" rx="3" fill="#d4844a" stroke="#a85828" strokeWidth="1.5"/>
                <rect x="-22" y="37" width="44" height="6" rx="2" fill="#b86828" stroke="#a85828" strokeWidth="1"/>
              </g>

              {/* PALITA DE JARDÍN */}
              <line x1="1478" y1="38" x2="1478" y2="56" stroke="#9a7a50" strokeWidth="2.5" opacity="0.8"/>
              <g transform="translate(1478, 56)">
                <rect x="-11" y="0" width="22" height="28" rx="11" fill="#c8a060" stroke="#a07840" strokeWidth="2"/>
                <line x1="-9" y1="10" x2="9" y2="10" stroke="#a07840" strokeWidth="1.5" opacity="0.5"/>
                <line x1="-9" y1="19" x2="9" y2="19" stroke="#a07840" strokeWidth="1.5" opacity="0.5"/>
                <rect x="-14" y="25" width="28" height="9" rx="3" fill="#888878" stroke="#666658" strokeWidth="1.5"/>
                <path d="M-24 34 L24 34 L20 66 Q0 76 -20 66 Z" fill="#b8b8a8" stroke="#808070" strokeWidth="2"/>
                <line x1="0" y1="36" x2="0" y2="74" stroke="#d0d0c0" strokeWidth="2" opacity="0.5"/>
                <path d="M-14 38 C-17 50, -15 62, -10 72" fill="none" stroke="#d8d8c8" strokeWidth="1.5" opacity="0.4"/>
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
