
"use client";

import Link from "next/link";
import { Icons } from "@/components/icons";
import { CartSheet } from "@/components/cart/cart-sheet";

export function Header() {
  const navLinks = [
    { name: "Catálogo", href: "#catalogo" },
    { name: "Asesor IA", href: "#asesor-ia" },
    { name: "Comunidad", href: "#comunidad" },
    { name: "Contacto", href: "#contacto" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm shadow-md" style={{ backgroundColor: 'hsl(40, 25%, 92%)' }}>
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center space-x-3">
          <div className="h-10 w-10 flex items-center justify-center">
            <Icons />
          </div>
          <span className="font-bold text-xl font-headline hidden sm:inline-block" style={{ color: '#1a3d15' }}>
            Jardín y Huerta Labranza
          </span>
          <span className="font-bold text-xl font-headline sm:hidden" style={{ color: '#1a3d15' }}>
            JHL
          </span>
        </Link>

        {/* Agrupamos la navegación y el carrito para un mejor control del diseño */}
        <div className="flex items-center gap-2">
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors hover:opacity-90"
                style={{ backgroundColor: '#8b5e3c', color: '#fdf5ee' }}
              >
                {link.name}
              </a>
            ))}
            <a
              href="#ubicacion"
              className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors hover:opacity-90"
              style={{ backgroundColor: '#8b5e3c', color: '#fdf5ee' }}
            >
              Ubicación
            </a>
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
