
"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateProduct, type Product } from "@/services/catalog-service";
import { useAuth } from "@/hooks/use-auth";

const formSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  price: z.string().regex(/^\$?[\d,.]*$/, { message: "Introduce un precio válido (ej: $15.500 o 15500)." }),
  barcode: z.string().optional(),
  stockMinimo: z.coerce
    .number({ invalid_type_error: "Debe ser un número." })
    .int({ message: "Debe ser un número entero." })
    .min(0, { message: "No puede ser negativo." })
    .optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditProductDialogProps {
  product: Product;
  categoryId: string;
  onProductUpdated: () => void;
}

export function EditProductDialog({ product, categoryId, onProductUpdated }: EditProductDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product.name ?? "",
      price: product.price ?? "",
      barcode: product.barcode ?? "",
      stockMinimo: product.stockMinimo ?? 3,
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!isAdmin) {
      toast({ title: "Acción no permitida", description: "No tienes permisos para editar productos.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const cleanPrice = data.price.replace(/[^0-9]/g, "");
      const priceToSave = data.price.startsWith("$")
        ? data.price
        : `$${parseInt(cleanPrice, 10).toLocaleString("es-CL")}`;

      await updateProduct(categoryId, product.id, {
        name: data.name,
        price: priceToSave,
        image: product.image,
        inStock: product.inStock,
        barcode: data.barcode?.trim() || undefined,
        stockMinimo: data.stockMinimo,
      });

      toast({
        title: "Producto Actualizado",
        description: `"${data.name}" se ha guardado correctamente.`,
      });
      onProductUpdated();
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error al actualizar",
        description: "No se pudo guardar el producto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground" disabled={!isAdmin}>
          <Pencil className="h-5 w-5" />
          <span className="sr-only">Editar producto</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Producto</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Producto</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio</FormLabel>
                  <FormControl>
                    <Input placeholder="$1.234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="barcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de Barras (EAN/SKU)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 7802300012458" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stockMinimo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock mínimo (alerta)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} placeholder="Ej: 5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
