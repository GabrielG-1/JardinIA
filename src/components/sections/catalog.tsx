
"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { FlaskConical, Sprout, Package, Wheat, Leaf, type LucideIcon, AlertTriangle, Wrench, Fence, SprayCan, Flower, Carrot, TestTube, Shirt, Layers, ShoppingCart, Check } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getCatalog, type Category, type Product } from "@/services/catalog-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/use-cart";
import { Badge } from "@/components/ui/badge";

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

const formatPrice = (price: string) => {
    const number = parseInt(price.replace(/[^0-9]/g, ''), 10);
    if (isNaN(number)) {
        return price; // Return original if not a number
    }
    return `$${number.toLocaleString('es-CL')}`;
};

function ProductCard({ 
  product, 
}: { 
  product: Product, 
}) {
  const { toast } = useToast();
  const { addItem, getItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const itemInCart = getItem(product.id);
  const isOutOfStock = product.inStock === false;

  const handleAddToCart = () => {
    if (!product.id) return; // Evita añadir productos sin ID
    addItem(product);
    toast({
      title: "Producto Añadido",
      description: `${product.name} fue añadido a tu carrito.`,
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <Card className="flex flex-col transition-all duration-300 hover:shadow-lg hover:scale-105 bg-background overflow-hidden relative">
      <CardHeader className="p-0">
        <Image
          src={product.image}
          alt={product.name}
          width={200}
          height={200}
          className={`rounded-t-lg object-cover w-full aspect-square ${isOutOfStock ? "grayscale" : ""}`}
          {...(product.aiHint && { "data-ai-hint": product.aiHint })}
        />
        {isOutOfStock && (
            <Badge variant="destructive" className="absolute top-2 left-2 text-sm px-3 py-1 bg-red-600/90 text-white border-red-700">
             Agotado
            </Badge>
        )}
      </CardHeader>
      <CardContent className="flex-grow p-2">
        <CardTitle className="text-sm font-semibold h-10 overflow-hidden leading-tight">{product.name}</CardTitle>
      </CardContent>
      <CardFooter className="p-2 pt-0 flex justify-between items-center">
        <p className="text-base font-bold text-primary">{formatPrice(product.price)}</p>
        <Button size="sm" onClick={handleAddToCart} disabled={isOutOfStock || !!itemInCart || isAdded} className={itemInCart || isAdded ? 'bg-green-500 hover:bg-green-600' : ''}>
           {itemInCart || isAdded ? <Check /> : <ShoppingCart />}
        </Button>
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
      }, (err) => { // Passing an error handler to getCatalog
        console.error(err);
        setError("No se pudieron cargar los productos. Verifique la configuración de Firebase y las reglas de seguridad.");
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los productos. Verifique la configuración de Firebase y las reglas de seguridad.");
      setLoading(false);
    }
  }, []);
  
  if (loading) {
    return (
        <section id="catalogo" className="py-20" style={{ backgroundColor: 'hsl(var(--card))' }}>
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                <h2 className="text-4xl font-bold font-headline">Nuestro Catálogo</h2>
                <p className="text-muted-foreground mt-2">Explora nuestra selección de alta calidad.</p>
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
        <Accordion type="multiple" className="w-full max-w-7xl mx-auto">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pt-4">
                  {Array.isArray(category.products) && category.products.map((product) => (
                    <ProductCard 
                      key={product.id}
                      product={product} 
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

    
