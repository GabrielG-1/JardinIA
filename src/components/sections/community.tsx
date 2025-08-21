"use client";

import { useEffect, useState } from "react";
import { addCommunityTip, getCommunityTips } from "@/services/community-tips-service";
import { type Tip } from "@/types/tip";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "../ui/skeleton";
import { Users, Send } from "lucide-react";

export function CommunitySection() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [newName, setNewName] = useState("");
  const [newAdvice, setNewAdvice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = getCommunityTips((tipsData) => {
      setTips(tipsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && newAdvice.trim()) {
      await addCommunityTip({ name: newName, advice: newAdvice });
      setNewName("");
      setNewAdvice("");
    }
  };

  return (
    <section id="comunidad" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-2 font-headline">Consejos de la Comunidad</h2>
            <p className="text-muted-foreground">
            Un espacio para compartir conocimientos y experiencias de jardinería.
            </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 text-left">
          <div className="lg:col-span-2 space-y-4">
              {loading && Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="p-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-1 bg-primary" />
                        <div className="w-full">
                            <Skeleton className="h-4 w-3/4 mb-4" />
                            <Skeleton className="h-4 w-1/4 ml-auto" />
                        </div>
                    </div>
                </Card>
              ))}
              {!loading && tips.map((tip) => (
                <Card key={tip.id} className="bg-card/80 p-6 shadow-md">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-12 bg-primary rounded-full" />
                        <div className="flex-grow">
                            <p className="text-foreground/90 text-lg mb-2">{tip.advice}</p>
                            <p className="text-right text-muted-foreground font-semibold">- {tip.name}</p>
                        </div>
                    </div>
                </Card>
              ))}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline"><Users />Comparte tu Consejo</CardTitle>
                <CardDescription>¿Tienes un tip de jardinería? ¡Compártelo con la comunidad!</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="sr-only">Tu Nombre</label>
                    <Input
                      id="name"
                      placeholder="Tu nombre"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="advice" className="sr-only">Tu Consejo</label>
                    <Textarea
                      id="advice"
                      placeholder="Escribe tu consejo aquí..."
                      value={newAdvice}
                      onChange={(e) => setNewAdvice(e.target.value)}
                      required
                      rows={5}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                    <Send className="w-4 h-4 mr-2"/>
                    Publicar Consejo
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
