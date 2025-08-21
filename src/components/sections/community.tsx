"use client";

import { useEffect, useState } from "react";
import { addCommunityTip, getCommunityTips } from "@/services/community-tips-service";
import { type Tip } from "@/types/tip";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "../ui/skeleton";

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
      <div className="container mx-auto text-center">
        <h2 className="text-4xl font-bold mb-4 font-headline">Consejos de la Comunidad</h2>
        <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
          Aprende de la experiencia de otros agricultores y jardineros. ¡Y no dudes en compartir tus propios consejos!
        </p>

        <div className="grid lg:grid-cols-3 gap-12 text-left">
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold mb-6 font-headline">Últimos Consejos</h3>
            <div className="space-y-6">
              {loading && Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <Skeleton className="h-6 w-1/3" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6 mt-2" />
                  </CardContent>
                </Card>
              ))}
              {!loading && tips.map((tip) => (
                <Card key={tip.id} className="bg-card/80">
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                    <Avatar>
                      <AvatarFallback>{tip.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg">{tip.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground/90">{tip.advice}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <Card className="sticky top-24 bg-primary/10">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">Comparte tu Sabiduría</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="sr-only">Tu Nombre</label>
                    <Input
                      id="name"
                      placeholder="Tu Nombre"
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
                  <Button type="submit" className="w-full">Enviar Consejo</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
