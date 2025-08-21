"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Upload } from 'lucide-react';
import { getHeroSettings, updateHeroImage } from '@/services/settings-service';
import { uploadHeroImage } from '@/services/storage-service';
import { useToast } from '@/hooks/use-toast';

export function HeroSection() {
  const [heroImageUrl, setHeroImageUrl] = useState("https://placehold.co/1920x1080/2E8B57/FFFFFF.png");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = getHeroSettings((settings) => {
      if (settings?.imageUrl) {
        setHeroImageUrl(settings.imageUrl);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const downloadURL = await uploadHeroImage(file);
        await updateHeroImage(downloadURL);
        toast({
          title: "Imagen de fondo actualizada",
          description: "La imagen principal se ha cambiado correctamente.",
        });
      } catch (error) {
        toast({
          title: "Error al subir la imagen",
          description: "No se pudo cambiar la imagen de fondo. Inténtalo de nuevo.",
          variant: "destructive",
        });
        console.error("Error uploading hero image: ", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <section id="hero" className="relative h-[calc(100vh-80px)] min-h-[600px] flex items-center justify-center text-white mt-20 group/hero">
      <Image
        src={heroImageUrl}
        alt="Fondo de campo de cultivo verde"
        fill
        className="object-cover -z-10"
        priority
        data-ai-hint="green farmland"
      />
      <div className="absolute inset-0 bg-black/50" />

      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/hero:opacity-100 transition-opacity flex items-center justify-center">
            <Button onClick={handleButtonClick} disabled={isUploading}>
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? "Subiendo..." : "Cambiar Fondo"}
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleImageUpload}
            />
        </div>

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
