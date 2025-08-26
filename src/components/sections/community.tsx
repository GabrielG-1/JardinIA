
"use client";

import { useEffect, useState } from "react";
import { addCommunityTip, addReplyToTip, getCommunityTips, deleteCommunityTip, deleteReplyFromTip } from "@/services/community-tips-service";
import { type Tip, type Reply } from "@/types/tip";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "../ui/skeleton";
import { Users, Send, MessageSquare, CornerDownRight, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/use-auth";
import { ConfirmDeleteDialog } from "../admin/confirm-delete-dialog";

function ReplyForm({ tipId, onReplyAdded }: { tipId: string; onReplyAdded: () => void }) {
    const [name, setName] = useState("");
    const [advice, setAdvice] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleReplySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !advice.trim()) {
            toast({ title: "Por favor, completa todos los campos.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            await addReplyToTip(tipId, { name, advice });
            toast({ title: "Respuesta enviada", description: "Gracias por tu contribución." });
            setName("");
            setAdvice("");
            onReplyAdded();
        } catch (error) {
            toast({ title: "Error al enviar la respuesta", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleReplySubmit} className="space-y-3 mt-4">
            <Input
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
            />
            <Textarea
                placeholder="Escribe tu respuesta aquí..."
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                required
                rows={3}
            />
            <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar Respuesta"}
            </Button>
        </form>
    );
}


function TipCard({ tip, isAdmin }: { tip: Tip, isAdmin: boolean }) {
    const [isReplyOpen, setIsReplyOpen] = useState(false);

    return (
      <Card key={tip.id} className="p-6 shadow-md bg-background">
        <div className="flex items-start gap-4">
          <div className="w-1.5 h-12 bg-primary rounded-full mt-1 shrink-0" />
          <div className="flex-grow">
            <div className="flex justify-between items-start">
                <p className="text-foreground/90 text-lg mb-2 break-words flex-grow pr-4">{tip.advice}</p>
                {isAdmin && (
                    <ConfirmDeleteDialog
                        triggerButton={
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 shrink-0">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        }
                        onConfirm={() => deleteCommunityTip(tip.id)}
                        dialogTitle="¿Eliminar este consejo?"
                        dialogDescription="Esta acción no se puede deshacer. El consejo y todas sus respuestas se eliminarán permanentemente."
                    />
                )}
            </div>
            <p className="text-right text-muted-foreground font-semibold">- {tip.name}</p>
            
            {tip.replies && tip.replies.length > 0 && (
                <div className="mt-4 space-y-3">
                    {tip.replies.map((reply, index) => (
                        <div key={index} className="flex items-start gap-3 pl-4 border-l-2 border-accent ml-4">
                           <CornerDownRight className="w-4 h-4 text-accent mt-1 shrink-0"/>
                           <div className="flex-grow">
                             <div className="flex justify-between items-start">
                                <p className="text-foreground/80 text-base break-words flex-grow pr-2">{reply.advice}</p>
                                {isAdmin && (
                                    <ConfirmDeleteDialog
                                        triggerButton={
                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 shrink-0 h-8 w-8">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        }
                                        onConfirm={() => deleteReplyFromTip(tip.id, reply)}
                                        dialogTitle="¿Eliminar esta respuesta?"
                                        dialogDescription="Esta acción no se puede deshacer y eliminará la respuesta de forma permanente."
                                    />
                                )}
                             </div>
                             <p className="text-right text-muted-foreground/80 text-sm font-semibold">- {reply.name}</p>
                           </div>
                        </div>
                    ))}
                </div>
            )}

            <Collapsible open={isReplyOpen} onOpenChange={setIsReplyOpen}>
                <CollapsibleTrigger asChild>
                     <Button variant="ghost" size="sm" className="mt-4">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Responder
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <ReplyForm tipId={tip.id} onReplyAdded={() => setIsReplyOpen(false)} />
                </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </Card>
    );
}

export function CommunitySection() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [newName, setNewName] = useState("");
  const [newAdvice, setNewAdvice] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

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
      setIsSubmitting(true);
      const isApproved = await addCommunityTip({ name: newName, advice: newAdvice });
      setIsSubmitting(false);

      if (isApproved) {
        toast({
          title: "¡Consejo Recibido!",
          description: "Gracias por tu aporte. Tu consejo ha sido publicado.",
        });
        setNewName("");
        setNewAdvice("");
      } else {
        toast({
          title: "Consejo No Relevante",
          description: "Nuestro sistema de IA ha determinado que tu consejo no está relacionado con la temática del sitio.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <section id="comunidad" className="py-20 px-4" style={{ backgroundColor: 'hsl(var(--card))' }}>
      <div className="container mx-auto">
        <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-2 font-headline">Consejos de la Comunidad</h2>
            <p className="text-muted-foreground">
            Un espacio para compartir conocimientos y experiencias de jardinería.
            </p>
        </div>

        <Accordion type="single" collapsible className="w-full max-w-4xl mx-auto">
            <AccordionItem value="community-tips" className="border-border bg-background rounded-lg shadow-sm">
                 <AccordionTrigger className="text-2xl font-headline hover:no-underline px-6 py-4">
                    <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-primary" />
                        Leer o Compartir Consejos
                    </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pt-4">
                    <div className="grid lg:grid-cols-3 gap-12 text-left">
                    <div className="lg:col-span-2 space-y-4">
                        {loading && Array.from({ length: 2 }).map((_, i) => (
                            <Card key={i} className="p-6 bg-background">
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
                           <TipCard key={tip.id} tip={tip} isAdmin={isAdmin} />
                        ))}
                    </div>

                    <div className="lg:col-span-1">
                        <Card className="sticky top-24 shadow-lg bg-background">
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
                            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                                <Send className="w-4 h-4 mr-2"/>
                                {isSubmitting ? "Publicando..." : "Publicar Consejo"}
                            </Button>
                            </form>
                        </CardContent>
                        </Card>
                    </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}
