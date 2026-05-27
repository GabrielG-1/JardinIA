
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addProductToCategory, type Category } from "@/services/catalog-service";
import { uploadProductImage } from "@/services/storage-service";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";

const formSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  price: z.string().regex(/^\$?[\d,.]*$/, { message: "Introduce un precio válido (ej: $15.500 o 15500)." }),
  categoryId: z.string({ required_error: "Debes seleccionar una categoría." }),
  image: z.instanceof(File, { message: "Se requiere una imagen para el producto." }).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateProductDialogProps {
  categories: Category[];
  onProductCreated: () => void;
}

export function CreateProductDialog({ categories, onProductCreated }: CreateProductDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      price: '',
      categoryId: '',
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("image", file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!isAdmin) {
      toast({ title: "Acción no permitida", description: "No tienes permisos para crear productos.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    let imageUrl = "https://placehold.co/200x200.png"; // Default image

    try {
      const safeProductName = data.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const tempProductId = `${data.categoryId}-${safeProductName}`;

      // 1. Subir la imagen si se proporcionó
      if (data.image) {
        imageUrl = await uploadProductImage(data.image, tempProductId);
      }

      // 2. Formatear el precio
      const cleanPrice = data.price.replace(/[^0-9]/g, '');
      const priceToSave = data.price.startsWith('$') ? data.price : `$${parseInt(cleanPrice, 10).toLocaleString('es-CL')}`;
      
      // 3. Crear el producto en Firestore
      await addProductToCategory(data.categoryId, {
        name: data.name,
        price: priceToSave,
        image: imageUrl,
        aiHint: "", // Default AI hint
      });

      toast({
        title: "Producto Creado",
        description: `"${data.name}" se ha añadido correctamente.`,
      });
      onProductCreated();
      form.reset();
      setImagePreview(null);
      setIsOpen(false);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error al crear el producto",
        description: `No se pudo guardar el producto. Código: ${error.code || 'desconocido'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
        form.reset();
        setImagePreview(null);
    }
    setIsOpen(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button disabled={!isAdmin}>
          <PlusCircle className="mr-2 h-5 w-5" />
          Crear Producto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Producto</DialogTitle>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nombre del Producto</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
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
                        <FormControl><Input placeholder="$1.234" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Categoría</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una categoría" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Imagen del Producto</FormLabel>
                            <FormControl>
                                <div className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center text-center h-32">
                                {imagePreview ? (
                                    <Image src={imagePreview} alt="Vista previa" width={80} height={80} className="rounded-md object-cover h-full" />
                                ) : (
                                    <label htmlFor="product-image-upload" className="cursor-pointer text-primary font-semibold flex flex-col items-center gap-2">
                                        <UploadCloud className="w-8 h-8" />
                                        <span>Subir imagen (Opcional)</span>
                                    </label>
                                )}
                                <input id="product-image-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
                                </div>
                            </FormControl>
                             <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Guardando..." : "Crear Producto"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
