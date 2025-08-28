"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ShoppingCart, Check } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import type { Product } from "@/services/catalog-service";
import { Badge } from "@/components/ui/badge";


const formatPrice = (price: string) => {
    if (!price) return "$0";
    const number = parseInt(price.replace(/[^0-9]/g, ''), 10);
    if (isNaN(number)) {
        return price; 
    }
    return `$${number.toLocaleString('es-CL')}`;
};


export function ProductCard({ product }: { product: Product }) {
  const { toast } = useToast();
  const { addItem, getItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const itemInCart = useMemo(() => getItem(product.id), [getItem, product.id]);
  const isOutOfStock = product.inStock === false;

  useEffect(() => {
      // Sincroniza el estado 'isAdded' si el ítem se elimina del carrito desde otro lugar.
      if (!itemInCart) {
          setIsAdded(false);
      }
  }, [itemInCart]);


  const handleAddToCart = () => {
    if (!product.id) return; 
    addItem(product);
    toast({
      title: "Producto Añadido",
      description: `${product.name} fue añadido a tu carrito.`,
    });
    setIsAdded(true);
    // No necesitamos un timeout para revertir 'isAdded' porque el estado ahora
    // depende de si el item está realmente en el carrito (vía `itemInCart`).
  };

  const priceText = useMemo(() => {
    return formatPrice(product?.price ?? "");
  }, [product?.price]);

  return (
    <Card className="flex flex-col transition-all duration-300 hover:shadow-lg hover:scale-105 bg-background overflow-hidden relative">
      <CardHeader className="p-0">
        <Image
          src={product.image || 'https://placehold.co/200x200.png'}
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
        <p className="text-base font-bold text-primary">{priceText}</p>
        <Button size="sm" onClick={handleAddToCart} disabled={isOutOfStock || !!itemInCart} className={!!itemInCart ? 'bg-green-500 hover:bg-green-600' : ''}>
           {!!itemInCart ? <Check /> : <ShoppingCart />}
        </Button>
      </CardFooter>
    </Card>
  );
}