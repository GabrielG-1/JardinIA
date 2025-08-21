import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export function HeroSection() {
  return (
    <section id="hero" className="relative h-[calc(100vh-80px)] min-h-[600px] flex items-center justify-center text-white mt-20">
      <Image
        src="https://placehold.co/1920x1080.png"
        alt="Fondo de campo de cultivo"
        fill
        className="object-cover -z-10"
        priority
        data-ai-hint="crop field"
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 text-center p-4 max-w-4xl">
        <div className="bg-black/40 p-8 md:p-12 rounded-lg backdrop-blur-sm">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 font-headline text-shadow-lg">
            Tu Aliado en el Campo y Jardín
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Encuentra todo lo que necesitas para tus cultivos y animales. Calidad, experiencia y los mejores precios.
          </p>
          <div className="flex w-full max-w-xl mx-auto items-center space-x-2">
            <Input
              type="search"
              placeholder="Buscar productos, semillas, fertilizantes..."
              className="bg-white/90 text-foreground"
            />
            <Button type="submit" size="lg" className='bg-accent hover:bg-accent/90 text-accent-foreground'>
              <Search className="h-5 w-5 mr-2" />
              Buscar
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
