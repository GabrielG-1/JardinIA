import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { FlaskConical, Sprout, Package, Wheat, type LucideIcon } from "lucide-react";

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

const catalogData: Category[] = [
  {
    name: "Agroquímicos",
    icon: FlaskConical,
    products: [
      { name: "Herbicida Total", price: "$25.99", image: "https://placehold.co/300x300.png", aiHint: "herbicide bottle" },
      { name: "Fungicida Preventivo", price: "$19.50", image: "https://placehold.co/300x300.png", aiHint: "fungicide spray" },
      { name: "Insecticida Orgánico", price: "$22.00", image: "https://placehold.co/300x300.png", aiHint: "insecticide product" },
    ],
  },
  {
    name: "Fertilizantes",
    icon: Sprout,
    products: [
      { name: "Abono Crecimiento", price: "$15.00", image: "https://placehold.co/300x300.png", aiHint: "fertilizer bag" },
      { name: "Fertilizante Floración", price: "$18.75", image: "https://placehold.co/300x300.png", aiHint: "flowering fertilizer" },
      { name: "Humus de Lombriz", price: "$12.99", image: "https://placehold.co/300x300.png", aiHint: "worm castings soil" },
    ],
  },
  {
    name: "Semillas",
    icon: Package,
    products: [
      { name: "Semillas de Tomate", price: "$3.50", image: "https://placehold.co/300x300.png", aiHint: "seed packet tomato" },
      { name: "Semillas de Lechuga", price: "$2.99", image: "https://placehold.co/300x300.png", aiHint: "seed packet lettuce" },
      { name: "Mix de Aromáticas", price: "$5.00", image: "https://placehold.co/300x300.png", aiHint: "herb seed mix" },
    ],
  },
  {
    name: "Nutrición Animal",
    icon: Wheat,
    products: [
      { name: "Alimento para Aves", price: "$30.00", image: "https://placehold.co/300x300.png", aiHint: "bird feed bag" },
      { name: "Pienso para Conejos", price: "$28.50", image: "https://placehold.co/300x300.png", aiHint: "rabbit food" },
      { name: "Suplemento para Ganado", price: "$55.20", image: "https://placehold.co/300x300.png", aiHint: "livestock feed" },
    ],
  },
];

function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="p-0">
        <Image
          src={product.image}
          alt={product.name}
          width={300}
          height={300}
          className="rounded-t-lg object-cover w-full aspect-square"
          data-ai-hint={product.aiHint}
        />
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
  return (
    <section id="catalogo" className="py-20 bg-primary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold font-headline">Nuestro Catálogo</h2>
          <p className="text-muted-foreground mt-2">Explora nuestra selección de productos de alta calidad.</p>
        </div>
        <Accordion type="single" collapsible className="w-full max-w-4xl mx-auto" defaultValue="item-0">
          {catalogData.map((category, index) => (
            <AccordionItem key={category.name} value={`item-${index}`}>
              <AccordionTrigger className="text-2xl font-headline hover:no-underline">
                <div className="flex items-center gap-3">
                  <category.icon className="h-8 w-8 text-primary" />
                  {category.name}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                  {category.products.map((product) => (
                    <ProductCard key={product.name} product={product} />
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
