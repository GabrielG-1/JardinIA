"use client";

import { useState } from "react";
import { doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type Category } from "@/services/catalog-service";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderPlus, Pencil, Trash2 } from "lucide-react";

interface CategoryManagerProps {
  categories: Category[];
  onCategoryChanged: () => void;
}

function toSnakeCase(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export function CategoryManager({ categories, onCategoryChanged }: CategoryManagerProps) {
  const { toast } = useToast();

  // --- Crear categoría ---
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const generatedId = toSnakeCase(newName);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    if (!generatedId) {
      toast({ title: "Nombre inválido", description: "El nombre no genera un ID válido.", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      await setDoc(doc(db, "catalog", generatedId), {
        name: newName.trim(),
        icon: "Leaf",
        products: [],
      });
      toast({ title: "Categoría creada", description: `"${newName.trim()}" fue creada con ID "${generatedId}".` });
      setNewName("");
      onCategoryChanged();
    } catch (error: any) {
      toast({ title: "Error al crear", description: error.message ?? "No se pudo crear la categoría.", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  // --- Renombrar categoría ---
  const [selectedId, setSelectedId] = useState("");
  const [renameName, setRenameName] = useState("");
  const [renaming, setRenaming] = useState(false);

  const [deleteId, setDeleteId] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleRename = async () => {
    if (!selectedId || !renameName.trim()) return;
    setRenaming(true);
    try {
      await updateDoc(doc(db, "catalog", selectedId), { name: renameName.trim() });
      toast({ title: "Categoría renombrada", description: `La categoría fue renombrada a "${renameName.trim()}".` });
      setSelectedId("");
      setRenameName("");
      onCategoryChanged();
    } catch (error: any) {
      toast({ title: "Error al renombrar", description: error.message ?? "No se pudo renombrar la categoría.", variant: "destructive" });
    } finally {
      setRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const cat = categories.find((c) => c.id === deleteId);
    if (cat && cat.products && cat.products.length > 0) {
      toast({
        title: "No se puede eliminar",
        description: `La categoría "${cat.name}" tiene ${cat.products.length} producto(s). Elimina los productos primero.`,
        variant: "destructive",
      });
      return;
    }
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "catalog", deleteId));
      toast({ title: "Categoría eliminada", description: `La categoría fue eliminada correctamente.` });
      setDeleteId("");
      onCategoryChanged();
    } catch (error: any) {
      toast({ title: "Error al eliminar", description: error.message ?? "No se pudo eliminar la categoría.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Crear categoría */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderPlus className="h-4 w-4 text-primary" />
            Crear categoría
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-category-name">Nombre visible</Label>
            <Input
              id="new-category-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej: Fertilizantes Foliares"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            {newName.trim() && (
              <p className="text-xs text-muted-foreground">
                ID generado: <span className="font-mono font-medium">{generatedId || "—"}</span>
              </p>
            )}
          </div>
          <Button
            onClick={handleCreate}
            disabled={creating || !newName.trim() || !generatedId}
            className="w-full"
          >
            {creating ? "Creando..." : "Crear categoría"}
          </Button>
        </CardContent>
      </Card>

      {/* Renombrar categoría */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Pencil className="h-4 w-4 text-primary" />
            Renombrar categoría
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Categoría existente</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rename-category-name">Nuevo nombre</Label>
            <Input
              id="rename-category-name"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              placeholder="Ej: Abonos Foliares"
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              disabled={!selectedId}
            />
          </div>
          <Button
            onClick={handleRename}
            disabled={renaming || !selectedId || !renameName.trim()}
            className="w-full"
          >
            {renaming ? "Renombrando..." : "Renombrar"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <Trash2 className="h-4 w-4" />
            Eliminar categoría
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Categoría a eliminar</Label>
            <Select value={deleteId} onValueChange={setDeleteId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name} {cat.products?.length ? `(${cat.products.length} productos)` : "(vacía)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Solo se pueden eliminar categorías vacías (sin productos).
          </p>
          <Button
            onClick={handleDelete}
            disabled={deleting || !deleteId}
            variant="destructive"
            className="w-full"
          >
            {deleting ? "Eliminando..." : "Eliminar categoría"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
