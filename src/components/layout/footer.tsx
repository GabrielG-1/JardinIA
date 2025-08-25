import Link from "next/link";
import { Facebook, Instagram, Twitter } from "lucide-react";
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
            <a href="#" aria-label="Facebook">
              <Facebook className="h-5 w-5" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <a href="#" aria-label="Instagram">
              <Instagram className="h-5 w-5" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <a href="#" aria-label="Twitter">
              <Twitter className="h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>
    </footer>
  );
}
