
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

interface DeleteConfirmationDialogProps {
  itemType: "consejo" | "respuesta";
  itemName: string;
  onConfirm: () => Promise<void>;
}

export function DeleteConfirmationDialog({ itemType, itemName, onConfirm }: DeleteConfirmationDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      // The toast is now shown in the parent component to allow for different messages.
    } catch (error) {
      console.error(`Error deleting ${itemType}:`, error);
      toast({
        title: `Error al eliminar ${itemType}`,
        description: `No se pudo eliminar el ${itemType}. Inténtalo de nuevo.`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  // FIX: Add a fallback for itemName to prevent runtime error if it's undefined.
  const safeItemName = itemName || "";
  const truncatedItemName = safeItemName.length > 50 ? `${safeItemName.substring(0, 50)}...` : safeItemName;

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 h-8 w-8">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Eliminar {itemType}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente el {itemType}:
            <br />
            <strong className="text-foreground">"{truncatedItemName}"</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
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
