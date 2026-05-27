
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { UploadCloud, Bot, CheckCircle, XCircle, Leaf, Dna, Stethoscope, Camera, ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { analyzePlantHealth } from "@/ai/flows/analyze-plant-health";
import { searchProducts } from "@/services/catalog-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CameraCapture } from "@/components/camera-capture";
import type { Product } from "@/services/catalog-service";
import { useCart } from "@/hooks/use-cart";
// Import the return type of the flow
type AnalyzePlantHealthOutput = Awaited<ReturnType<typeof analyzePlantHealth>>;


const formatPrice = (price: string) => {
    const number = parseInt(price.replace(/[^0-9]/g, ''), 10);
    if (isNaN(number)) {
        return price;
    }
    return `$${number.toLocaleString('es-CL')}`;
};

function ProductRecommendationCard({ product }: { product: Product }) {
    const imageUrl = product.image && product.image.startsWith('http') 
        ? product.image 
        : 'https://placehold.co/200x200.png';
    
    const { addItem, getItem } = useCart();
    const { toast } = useToast();
    const [isAdded, setIsAdded] = useState(false);
    
    const productId = product.id;
    const itemInCart = getItem(productId);

    const handleAddToCart = () => {
        addItem(product);
        toast({
          title: "Producto Añadido",
          description: `${product.name} fue añadido a tu carrito.`,
        });
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
    };

    return (
        <Card className="flex flex-col">
            <CardHeader className="p-0">
                <Image src={imageUrl} alt={product.name} width={150} height={150} className="rounded-t-lg object-cover w-full aspect-square" />
            </CardHeader>
            <CardContent className="flex-grow p-3">
                <h4 className="font-semibold text-sm h-10">{product.name}</h4>
            </CardContent>
            <CardFooter className="p-3 pt-0 flex justify-between items-center">
                <p className="text-base font-bold text-primary">{formatPrice(product.price)}</p>
                <Button size="sm" onClick={handleAddToCart} disabled={!!itemInCart || isAdded} className={itemInCart || isAdded ? 'bg-green-500 hover:bg-green-600' : ''}>
                    {itemInCart || isAdded ? <Check /> : <ShoppingCart />}
                </Button>
            </CardFooter>
        </Card>
    );
}

// Full analysis object state
interface FullAnalysis {
  aiResponse: AnalyzePlantHealthOutput;
  foundProducts: Product[];
}

export function AiAdvisorSection() {
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FullAnalysis | null>(null); // New state for combined results
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (file.size > 4 * 1024 * 1024) { // 4MB limit for Gemini
      toast({
        title: "Archivo demasiado grande",
        description: "Por favor, sube una imagen de menos de 4MB.",
        variant: "destructive",
      });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoDataUri(reader.result as string);
      setPreviewUrl(URL.createObjectURL(file));
    };
    reader.readAsDataURL(file);
  }

  const handlePhotoTaken = (imageDataUri: string) => {
    setPhotoDataUri(imageDataUri);
    setPreviewUrl(imageDataUri);
    setIsCameraOpen(false);
  }

  const handleAnalysis = async () => {
    if (!photoDataUri && !description.trim()) {
      toast({
        title: "No hay información suficiente",
        description: "Por favor, sube una foto o describe el estado de tu planta.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      // Step 1: Get AI analysis and keywords
      const aiResponse = await analyzePlantHealth({ photoDataUri: photoDataUri ?? undefined, description });
      
      let foundProducts: Product[] = [];
      if (aiResponse.recommendedProductKeywords && aiResponse.recommendedProductKeywords.length > 0) {
        // Step 2: Search for products based on keywords returned by the AI
        const searchPromises = aiResponse.recommendedProductKeywords.map(term => searchProducts(term));
        const searchResults = await Promise.all(searchPromises);
        
        // Flatten and deduplicate results
        const allFoundProducts = searchResults.flat();
        const uniqueProducts = Array.from(new Map(allFoundProducts.map(p => [p.id, p])).values());
        foundProducts = uniqueProducts.slice(0, 4); // Limit to 4 products
      }

      // Step 3: Set the combined result
      setResult({ aiResponse, foundProducts });

    } catch (err) {
      console.error(err);
      toast({
        title: "Error en el análisis",
        description: "No se pudo analizar la planta. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const AnalysisResult = () => {
    if (!result) return null;

    const { aiResponse, foundProducts } = result;

    return (
      <Card className="mt-8 text-left">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bot /> Diagnóstico de la IA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!aiResponse.identification.isPlant ? (
            <div className="flex items-center gap-2 text-lg">
              <XCircle className="text-destructive" />
              <p>La imagen o descripción no parece ser de una planta.</p>
            </div>
          ) : (
            <>
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2"><Leaf /> Identificación</h3>
                <p><strong>Nombre Común:</strong> {aiResponse.identification.commonName}</p>
                <p><strong>Nombre Latino:</strong> {aiResponse.identification.latinName}</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2"><Stethoscope /> Diagnóstico de Salud</h3>
                <div className="flex items-center gap-2 mb-2">
                  {aiResponse.healthDiagnosis.isHealthy ? <CheckCircle className="text-primary" /> : <XCircle className="text-destructive" />}
                  <p className="font-bold text-lg">{aiResponse.healthDiagnosis.isHealthy ? "Planta Saludable" : aiResponse.healthDiagnosis.diagnosis || "Se Detectaron Problemas"}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2"><Dna /> Recomendaciones de Cuidado</h3>
                <div 
                  className="text-muted-foreground text-left space-y-2"
                  dangerouslySetInnerHTML={{ __html: aiResponse.healthDiagnosis.recommendations }}
                />
              </div>

              {foundProducts.length > 0 && (
                  <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2 mt-6 mb-4"><ShoppingCart /> Productos Recomendados de la Tienda</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {foundProducts.map((product) => (
                              <ProductRecommendationCard key={product.id} product={product} />
                          ))}
                      </div>
                  </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  const LoadingSkeleton = () => (
    <Card className="mt-8">
      <CardHeader>
        <Skeleton className="h-8 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="space-y-2">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-full" />
        </div>
         <div className="space-y-2">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-12 w-full" />
        </div>
      </CardContent>
    </Card>
  )

  return (
    <section id="asesor-ia" className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="text-4xl font-bold mb-4 font-headline">Asesor de Cultivos IA</h2>
        <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
          ¿No estás seguro de qué le pasa a tu planta? Sube una foto, descríbenos el problema y nuestra IA te dará un diagnóstico y recomendaciones.
        </p>

        <div className="grid md:grid-cols-2 gap-8 text-left">
          <Card>
            <CardHeader>
              <CardTitle>1. Añade una foto (Opcional)</CardTitle>
              <CardDescription>Usa tu cámara o sube una imagen clara.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center text-center">
                {previewUrl ? (
                  <div className="relative">
                    <Image src={previewUrl} alt="Vista previa de la planta" width={150} height={150} className="rounded-md object-cover h-[150px]" />
                    <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 bg-background rounded-full" onClick={() => { setPreviewUrl(null); setPhotoDataUri(null); }}>
                      <XCircle className="h-5 w-5 text-destructive" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[150px] space-y-4">
                     <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
                      <DialogTrigger asChild>
                         <Button variant="outline"><Camera className="mr-2"/> Tomar Foto</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                          <DialogHeader>
                              <DialogTitle>Capturar Foto</DialogTitle>
                          </DialogHeader>
                          <CameraCapture onPhotoTaken={handlePhotoTaken} />
                      </DialogContent>
                    </Dialog>

                    <div className="relative flex items-center w-full">
                      <div className="flex-grow border-t border-muted-foreground"></div>
                      <span className="flex-shrink mx-4 text-muted-foreground">o</span>
                      <div className="flex-grow border-t border-muted-foreground"></div>
                    </div>
                    
                    <label htmlFor="plant-photo" className="cursor-pointer text-primary font-semibold flex items-center gap-2">
                      <UploadCloud className="w-5 h-5" />
                      <span>Subir un archivo</span>
                    </label>
                    <input id="plant-photo" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>2. Describe el estado</CardTitle>
              <CardDescription>¿Qué síntomas has notado?</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Ej: Las hojas se están poniendo amarillas y tienen manchas marrones..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-[182px]"
              />
            </CardContent>
          </Card>
        </div>
        
        <Button size="lg" onClick={handleAnalysis} disabled={loading || (!photoDataUri && !description.trim())} className="mt-8">
          {loading ? "Analizando..." : "Obtener Diagnóstico"}
        </Button>
        
        {loading && <LoadingSkeleton />}
        {result && <AnalysisResult />}
      </div>
    </section>
  );
}
