"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ContactSection() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Contact form logic would go here
    alert("Gracias por tu mensaje. Nos pondremos en contacto contigo pronto.");
  };

  return (
    <section id="contacto" className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold font-headline">Contacto</h2>
          <p className="text-muted-foreground mt-2">¿Tienes alguna pregunta? Envíanos un mensaje.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <Input type="text" placeholder="Tu Nombre" required />
            <Input type="email" placeholder="Tu Correo Electrónico" required />
          </div>
          <Textarea placeholder="Tu Mensaje" rows={6} required />
          <div className="text-center">
            <Button type="submit" size="lg">Enviar Mensaje</Button>
          </div>
        </form>
      </div>
    </section>
  );
}
