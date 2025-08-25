"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart } from "@/hooks/use-cart";
import { ShoppingCart, Trash2, Plus, Minus, Send } from "lucide-react";
import Image from "next/image";

const formatPrice = (price: number) => {
    return `$${price.toLocaleString('es-CL')}`;
};

export function CartSheet() {
  const { items, totalItems, totalPrice, removeItem, updateItemQuantity, clearCart } = useCart();

  const handleWhatsAppOrder = () => {
    if (items.length === 0) return;

    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    
    if (!whatsappNumber) {
        alert("El número de WhatsApp no está configurado. Por favor, contacte al administrador.");
        return;
    }

    let message = '¡Hola! Quisiera hacer el siguiente pedido:\n\n';
    items.forEach(item => {
        const itemPrice = parseInt(item.price.replace(/[^0-9]/g, ''));
        message += `- ${item.quantity}x ${item.name} (${formatPrice(itemPrice)})\n`;
    });
    message += `\n*Total: ${formatPrice(totalPrice)}*`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge className="absolute -right-2 -top-2 h-6 w-6 rounded-full flex items-center justify-center p-0">
              {totalItems}
            </Badge>
          )}
          <span className="sr-only">Abrir carrito</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Carrito de Compras ({totalItems})</SheetTitle>
        </SheetHeader>
        {items.length > 0 ? (
          <>
            <ScrollArea className="flex-grow pr-4 -mr-6">
              <div className="space-y-4 py-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="rounded-md object-cover"
                    />
                    <div className="flex-grow">
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-primary font-bold">{formatPrice(parseInt(item.price.replace(/[^0-9]/g, '')))}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateItemQuantity(item.id!, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span>{item.quantity}</span>
                         <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateItemQuantity(item.id!, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <SheetFooter className="mt-auto pt-4 border-t">
              <div className="w-full space-y-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <Button className="w-full bg-green-500 hover:bg-green-600 text-white" size="lg" onClick={handleWhatsAppOrder}>
                  <Send className="mr-2"/>
                  Enviar Pedido por WhatsApp
                </Button>
                 <Button variant="outline" className="w-full" onClick={clearCart}>
                    Vaciar Carrito
                </Button>
              </div>
            </SheetFooter>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center">
            <ShoppingCart className="w-20 h-20 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold">Tu carrito está vacío</h3>
            <p className="text-muted-foreground">Añade productos para verlos aquí.</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
