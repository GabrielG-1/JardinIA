
"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { FlaskConical, Sprout, Package, Wheat, type LucideIcon, Upload } from "lucide-react";
import React, { useRef, useState } from "react";
import { uploadProductImage } from "@/services/storage-service";
import { useToast } from "@/hooks/use-toast";


type Product = {
  name: string;
  price: string;
  image: string;
  aiHint: string;
};

type Category = {
  name: string;
  icon: LucideIcon;
  products: Product[];
};

const initialCatalogData: Category[] = [
  {
    name: "Agroquímicos",
    icon: FlaskConical,
    products: [
      { name: "Herbicida Total", price: "$25.99", image: "https://placehold.co/200x200.png", aiHint: "herbicide bottle" },
      { name: "Fungicida Preventivo", price: "$19.50", image: "https://placehold.co/200x200.png", aiHint: "fungicide spray" },
      { name: "Insecticida Orgánico", price: "$22.00", image: "https://placehold.co/200x200.png", aiHint: "insecticide product" },
      { name: "Acaricida Concentrado", price: "$28.00", image: "https://placehold.co/200x200.png", aiHint: "acaricide bottle" },
    ],
  },
  {
    name: "Fertilizantes",
    icon: Sprout,
    products: [
      { name: "Abono Crecimiento", price: "$15.00", image: "https://placehold.co/200x200.png", aiHint: "fertilizer bag" },
      { name: "Fertilizante Floración", price: "$18.75", image: "https://placehold.co/200x200.png", aiHint: "flowering fertilizer" },
      { name: "Humus de Lombriz", price: "$12.99", image: "https://placehold.co/200x200.png", aiHint: "worm castings soil" },
      { name: "Corrector de Carencias", price: "$16.50", image: "https://placehold.co/200x200.png", aiHint: "plant nutrient" },
    ],
  },
  {
    name: "Semillas",
    icon: Package,
    products: [
      { name: "Semillas de Tomate", price: "$3.50", image: "https://placehold.co/200x200.png", aiHint: "seed packet tomato" },
      { name: "Semillas de Lechuga", price: "$2.99", image: "https://placehold.co/200x200.png", aiHint: "seed packet lettuce" },
      { name: "Mix de Aromáticas", price: "$5.00", image: "https://placehold.co/200x200.png", aiHint: "herb seed mix" },
      { name: "Semillas de Zanahoria", price: "$3.20", image: "https://placehold.co/200x200.png", aiHint: "carrot seed packet" },
    ],
  },
  {
    name: "Nutrición Animal",
    icon: Wheat,
    products: [
      { name: "Alimento para Aves", price: "$30.00", image: "https://placehold.co/200x200.png", aiHint: "bird feed bag" },
      { name: "Pienso para Conejos", price: "$28.50", image: "https://placehold.co/200x200.png", aiHint: "rabbit food" },
      { name: "Suplemento para Ganado", price: "$55.20", image: "https://placehold.co/200x200.png", aiHint: "livestock feed" },
      { name: "Snacks para Mascotas", price: "$8.99", image: "https://placehold.co/200x200.png", aiHint: "pet snacks" },
    ],
  },
];

function ProductCard({ product, onImageChange }: { product: Product, onImageChange: (newImageUrl: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const downloadURL = await uploadProductImage(file, product.name);
        onImageChange(downloadURL);
        toast({
          title: "Imagen actualizada",
          description: `La imagen de ${product.name} se ha cambiado correctamente.`,
        });
      } catch (error) {
        toast({
          title: "Error al subir la imagen",
          description: "No se pudo subir la imagen. Inténtalo de nuevo.",
          variant: "destructive",
        });
        console.error("Error uploading image: ", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="flex flex-col transition-all duration-300 hover:shadow-lg hover:scale-105 bg-background group/product">
      <CardHeader className="p-0 relative">
        <Image
          src={product.image}
          alt={product.name}
          width={200}
          height={200}
          className="rounded-t-lg object-cover w-full aspect-square"
          data-ai-hint={product.aiHint}
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/product:opacity-100 transition-opacity flex items-center justify-center">
            <Button onClick={handleButtonClick} disabled={isUploading}>
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? "Subiendo..." : "Cambiar Imagen"}
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleImageUpload}
            />
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <CardTitle className="text-lg font-semibold">{product.name}</CardTitle>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <p className="text-xl font-bold text-primary">{product.price}</p>
        <Button>Añadir</Button>
      </CardFooter>
    </Card>
  );
}

export function CatalogSection() {
  const [catalogData, setCatalogData] = useState(initialCatalogData);

  const handleImageChange = (categoryName: string, productName: string, newImageUrl: string) => {
    setCatalogData(prevData =>
      prevData.map(category => {
        if (category.name === categoryName) {
          return {
            ...category,
            products: category.products.map(product => {
              if (product.name === productName) {
                return { ...product, image: newImageUrl };
              }
              return product;
            }),
          };
        }
        return category;
      })
    );
  };
  
  return (
    <section id="catalogo" className="py-20" style={{ backgroundColor: 'hsl(var(--card))' }}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold font-headline">Nuestro Catálogo</h2>
          <p className="text-muted-foreground mt-2">Explora nuestra selección de productos de alta calidad.</p>
        </div>
        <Accordion type="multiple" className="w-full max-w-6xl mx-auto" defaultValue={catalogData.map((_, i) => `item-${i}`)}>
          {catalogData.map((category, index) => (
            <AccordionItem key={category.name} value={`item-${index}`} className="border-border bg-background rounded-lg mb-4 shadow-sm">
              <AccordionTrigger className="text-2xl font-headline hover:no-underline px-6 py-4">
                <div className="flex items-center gap-3">
                  <category.icon className="h-8 w-8 text-primary" />
                  {category.name}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                  {category.products.map((product) => (
                    <ProductCard 
                      key={product.name} 
                      product={product} 
                      onImageChange={(newImageUrl) => handleImageChange(category.name, product.name, newImageUrl)}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
