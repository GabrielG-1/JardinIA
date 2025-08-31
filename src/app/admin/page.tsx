"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  email: z.string().email({ message: "Introduce un correo válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

type FormData = z.infer<typeof formSchema>;

export default function AdminLoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { user, isAdmin } = await signIn(data.email, data.password);
      if (user && isAdmin) {
        toast({ title: "Inicio de sesión exitoso", description: "Bienvenido al panel de administración." });
        // La redirección ahora es manejada por el layout
      } else if (user && !isAdmin) {
        toast({ title: "Acceso Denegado", description: "No tienes permisos de administrador.", variant: "destructive" });
      } else {
         toast({ title: "Error de inicio de sesión", description: "Credenciales incorrectas.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      let errorMessage = "Ocurrió un error inesperado.";
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        errorMessage = "El correo electrónico o la contraseña son incorrectos.";
      }
      toast({ title: "Error de inicio de sesión", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <Icons.Logo className="h-12 w-12 text-primary" />
          </div>
          <CardTitle>Panel de Administración</CardTitle>
          <CardDescription>Inicia sesión para gestionar la tienda.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="admin@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Ingresando..." : "Ingresar"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
