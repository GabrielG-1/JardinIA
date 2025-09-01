
"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deleteProduct, type Product } from "@/services/catalog-service";
import { useAuth } from "@/hooks/use-auth";

interface DeleteProductDialogProps {
  product: Product;
  categoryId: string;
  onProductDeleted: () => void;
}

export function DeleteProductDialog({ product, categoryId, onProductDeleted }: DeleteProductDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const handleDelete = async () => {
    if (!isAdmin) {
      toast({ title: "Acción no permitida", description: "No tienes permisos para eliminar productos.", variant: "destructive" });
      return;
    }
    setIsDeleting(true);
    try {
      await deleteProduct(categoryId, product.id);
      toast({
        title: "Producto Eliminado",
        description: `"${product.name}" se ha eliminado correctamente.`,
      });
      onProductDeleted();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar el producto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" disabled={!isAdmin}>
          <Trash2 className="h-5 w-5" />
          <span className="sr-only">Eliminar producto</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás absolutely seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente el producto
            <span className="font-semibold"> {product.name} </span>
            de la base de datos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? "Eliminando..." : "Sí, eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
