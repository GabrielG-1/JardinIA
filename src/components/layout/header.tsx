
"use client";

import Link from "next/link";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { CartSheet } from "@/components/cart/cart-sheet";

export function Header() {
  const navLinks = [
    { name: "Catálogo", href: "#catalogo" },
    { name: "Asesor IA", href: "#asesor-ia" },
    { name: "Comunidad", href: "#comunidad" },
    { name: "Contacto", href: "#contacto" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm shadow-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center space-x-3">
          <div className="h-10 w-10 flex items-center justify-center">
            <Icons />
          </div>
          <span className="font-bold text-xl text-foreground font-headline hidden sm:inline-block">
            Jardín y Huerta Labranza
          </span>
          <span className="font-bold text-xl text-foreground font-headline sm:hidden">
            JHL
          </span>
        </Link>

        {/* Agrupamos la navegación y el carrito para un mejor control del diseño */}
        <div className="flex items-center gap-2">
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Button key={link.name} variant="ghost" asChild>
                <a href={link.href}>{link.name}</a>
              </Button>
            ))}
            <Button variant="ghost" asChild>
                <a href="#ubicacion">Ubicación</a>
            </Button>
          </nav>
          
          <CartSheet />

          <nav className="md:hidden">
              {/* Mobile menu could be added here */}
          </nav>
        </div>
      </div>
    </header>
  );
}
