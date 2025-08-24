"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { uploadProductImage } from "@/services/storage-service";
import { updateProductImage } from "@/services/catalog-service";
import { Upload } from "lucide-react";

interface FileCardProps {
  file: {
    id: string;
    source: string;
    name: string;
    categoryName: string;
    categoryId: string;
  };
}

export function FileCard({ file }: FileCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setIsUploading(true);
      try {
        const downloadURL = await uploadProductImage(selectedFile, file.name);
        await updateProductImage(file.categoryId, file.name, downloadURL);

        toast({
          title: "Imagen Actualizada",
          description: `La imagen de ${file.name} se ha cambiado correctamente. La página puede tardar unos segundos en reflejar el cambio.`,
        });
      } catch (error) {
        console.error("Error uploading image:", error);
        toast({
          title: "Error al Subir Imagen",
          description: "No se pudo subir la nueva imagen. Por favor, inténtalo de nuevo.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="group/file-card relative overflow-hidden">
      <CardContent className="p-0">
        <Image
          src={file.source}
          alt={file.name}
          width={200}
          height={200}
          className="aspect-square w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 transition-opacity group-hover/file-card:opacity-100 flex items-center justify-center">
            <Button onClick={handleButtonClick} disabled={isUploading} size="sm">
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? "Subiendo..." : "Cambiar"}
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleImageUpload}
            />
        </div>
      </CardContent>
      <CardFooter className="p-2 text-xs">
        <div className="truncate">
          <p className="font-semibold truncate">{file.name}</p>
          <p className="text-muted-foreground truncate">{file.categoryName}</p>
        </div>
      </CardFooter>
    </Card>
  );
}
