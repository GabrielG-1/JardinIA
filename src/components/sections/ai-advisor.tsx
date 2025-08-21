"use client";

import { useState } from "react";
import Image from "next/image";
import { UploadCloud, Bot, CheckCircle, XCircle, Leaf, Dna, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { analyzePlantHealth, type AnalyzePlantHealthOutput } from "@/ai/flows/analyze-plant-health";
import { Skeleton } from "@/components/ui/skeleton";

export function AiAdvisorSection() {
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzePlantHealthOutput | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
  };

  const handleAnalysis = async () => {
    if (!photoDataUri) {
      toast({
        title: "Falta imagen",
        description: "Por favor, sube una foto de tu planta.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await analyzePlantHealth({ photoDataUri, description });
      setResult(res);
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

  const AnalysisResult = () => (
    <Card className="mt-8 bg-card/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Bot /> Diagnóstico de la IA</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!result!.identification.isPlant ? (
          <div className="flex items-center gap-2 text-lg">
            <XCircle className="text-destructive" />
            <p>La imagen no parece ser de una planta.</p>
          </div>
        ) : (
          <>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2"><Leaf /> Identificación</h3>
              <p><strong>Nombre Común:</strong> {result!.identification.commonName}</p>
              <p><strong>Nombre Latino:</strong> {result!.identification.latinName}</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2"><Stethoscope /> Diagnóstico de Salud</h3>
              <div className="flex items-center gap-2 mb-2">
                {result!.healthDiagnosis.isHealthy ? <CheckCircle className="text-primary" /> : <XCircle className="text-destructive" />}
                <p className="font-bold">{result!.healthDiagnosis.isHealthy ? "Planta Saludable" : "Se detectaron problemas"}</p>
              </div>
              <p className="text-muted-foreground">{result!.healthDiagnosis.diagnosis}</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2"><Dna /> Recomendaciones</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{result!.healthDiagnosis.recommendations}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

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
    <section id="asesor-ia" className="py-20 px-4">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="text-4xl font-bold mb-4 font-headline">Asesor de Cultivos IA</h2>
        <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
          ¿No estás seguro de qué le pasa a tu planta? Sube una foto, descríbenos el problema y nuestra IA te dará un diagnóstico y recomendaciones.
        </p>

        <div className="grid md:grid-cols-2 gap-8 text-left">
          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>1. Sube una foto</CardTitle>
              <CardDescription>Una imagen clara nos ayuda a diagnosticar mejor.</CardDescription>
            </CardHeader>
            <CardContent>
              <label htmlFor="plant-photo" className="cursor-pointer border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-accent/10 transition-colors">
                {previewUrl ? (
                  <Image src={previewUrl} alt="Vista previa de la planta" width={150} height={150} className="rounded-md object-cover h-[150px]" />
                ) : (
                  <>
                    <UploadCloud className="w-12 h-12 text-muted-foreground mb-2" />
                    <span className="text-primary font-semibold">Haz clic para subir</span>
                    <span className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP (Máx 4MB)</span>
                  </>
                )}
              </label>
              <input id="plant-photo" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
            </CardContent>
          </Card>
          
          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>2. Describe el estado</CardTitle>
              <CardDescription>¿Qué síntomas has notado? (Opcional)</CardDescription>
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
        
        <Button size="lg" onClick={handleAnalysis} disabled={loading} className="mt-8">
          {loading ? "Analizando..." : "Obtener Diagnóstico"}
        </Button>
        
        {loading && <LoadingSkeleton />}
        {result && <AnalysisResult />}
      </div>
    </section>
  );
}
