import Link from "next/link";
import { Facebook, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'hsl(var(--card))' }}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-center md:text-left">
        <div className="text-sm text-foreground/80 mb-4 md:mb-0">
            <p>&copy; {currentYear} Jardín y Huerta Labranza (JHL). Todos los derechos reservados.</p>
            <div className="text-xs">
                <Link href="/admin" className="hover:underline">
                    Admin Panel
                </Link>
            </div>
        </div>
        <div className="flex space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <a href="https://www.facebook.com/arreglos.huerta" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <Facebook className="h-5 w-5" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <a href="https://www.instagram.com/jardinyhuerta_labranza/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Instagram className="h-5 w-5" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <a href="https://www.tiktok.com/@jardinyhuerta.lbz" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
              </svg>
            </a>
          </Button>
        </div>
      </div>
    </footer>
  );
}
