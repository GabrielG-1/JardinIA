
"use client";

import { useEffect, useState } from "react";
import { addCommunityTip, getCommunityTips, addReplyToTip } from "@/services/community-tips-service";
import { type Tip } from "@/types/tip";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "../ui/skeleton";
import { Users, Send, CornerDownRight, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/hooks/use-auth";
import { DeleteConfirmationDialog } from "@/components/community/delete-confirmation-dialog";
import { deleteReplyFromTip } from "@/services/community-tips-service";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

function ReplyForm({ tipId, onReplyAdded }: { tipId: string, onReplyAdded: () => void }) {
  const [replyName, setReplyName] = useState("");
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (replyName.trim() && replyText.trim()) {
      setIsSubmitting(true);
      try {
        await addReplyToTip(tipId, { name: replyName, text: replyText });
        toast({
          title: "Respuesta enviada",
          description: "Gracias por tu contribución.",
        });
        setReplyName("");
        setReplyText("");
        onReplyAdded();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo enviar la respuesta.",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <form onSubmit={handleReplySubmit} className="mt-4 ml-8 pl-4 border-l-2 space-y-2">
       <Input
        placeholder="Tu nombre"
        value={replyName}
        onChange={(e) => setReplyName(e.target.value)}
        required
        className="h-9"
      />
      <Textarea
        placeholder="Escribe una respuesta..."
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        required
        rows={2}
      />
      <div className="flex justify-end">
        <Button size="sm" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Enviando..." : "Responder"}
        </Button>
      </div>
    </form>
  );
}


export function CommunitySection() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [newName, setNewName] = useState("");
  const [newAdvice, setNewAdvice] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openReplyForm, setOpenReplyForm] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

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
  
  const handleReplyDeleted = () => {
     toast({
      title: "Respuesta Eliminada",
      description: "La respuesta ha sido eliminada.",
    });
    // The real-time listener will update the UI automatically.
  }

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
                        <Card key={tip.id} className="p-6 shadow-md bg-background overflow-hidden relative">
                            <div className="flex items-start gap-4">
                                <div className="w-1.5 h-12 bg-primary rounded-full mt-1 shrink-0" />
                                <div className="flex-grow">
                                    <p className="text-foreground/90 text-lg mb-2">{tip.advice}</p>
                                    <p className="text-right text-muted-foreground font-semibold">- {tip.name}</p>
                                </div>
                            </div>
                             <div className="pl-4 mt-4 space-y-3">
                                {tip.replies?.sort((a, b) => a.createdAt.seconds - b.createdAt.seconds).map((reply, index) => (
                                    <div key={`${tip.id}-reply-${index}`} className="flex items-start gap-3 text-sm group">
                                        <CornerDownRight className="w-4 h-4 mt-1 text-muted-foreground shrink-0"/>
                                        <div className="flex-grow bg-muted/50 p-3 rounded-md relative">
                                             {isAdmin && (
                                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <DeleteConfirmationDialog
                                                        itemType="respuesta"
                                                        itemName={reply.text}
                                                        onConfirm={() => deleteReplyFromTip(tip.id, reply).then(handleReplyDeleted)}
                                                    />
                                                </div>
                                             )}
                                            <p className="text-foreground pr-8">{reply.text}</p>
                                            <p className="text-xs text-muted-foreground font-semibold mt-1">- {reply.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end mt-2">
                                <Button variant="ghost" size="sm" onClick={() => setOpenReplyForm(openReplyForm === tip.id ? null : tip.id)}>
                                    <MessageSquare className="mr-2" />
                                    Responder
                                </Button>
                            </div>
                            {openReplyForm === tip.id && <ReplyForm tipId={tip.id} onReplyAdded={() => setOpenReplyForm(null)} />}
                        </Card>
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
