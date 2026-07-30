"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type Category } from "@/services/catalog-service";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";

interface InventoryExcelProps {
  categories: Category[];
}

interface ExcelRow {
  categoria: string;
  nombre: string;
  barcode?: string;
  precio: string | number;
  stock: number;
  stockMinimo: number;
}

export function InventoryExcel({ categories }: InventoryExcelProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  // ---------------------------------------------------------------------------
  // Exportar
  // ---------------------------------------------------------------------------

  const handleExport = () => {
    const filas: ExcelRow[] = categories.flatMap((cat) =>
      cat.products.map((p) => ({
        categoria: cat.id,
        nombre: p.name,
        barcode: p.barcode ?? "",
        precio: p.price,
        stock: p.stock ?? 0,
        stockMinimo: p.stockMinimo ?? 0,
      }))
    );

    const ws = XLSX.utils.json_to_sheet(filas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, "inventario.xlsx");
  };

  // ---------------------------------------------------------------------------
  // Importar
  // ---------------------------------------------------------------------------

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    let updated = 0;
    let created = 0;

    try {
      const buffer = await file.arrayBuffer();
      const data = XLSX.read(new Uint8Array(buffer), { type: "array" });
      const filas: ExcelRow[] = XLSX.utils.sheet_to_json(
        data.Sheets[data.SheetNames[0]]
      );

      // Agrupar filas por categoría para minimizar lecturas/escrituras a Firestore
      const byCategory = new Map<string, ExcelRow[]>();
      for (const fila of filas) {
        if (!fila.categoria || !fila.nombre) continue;
        const key = String(fila.categoria).trim();
        if (!byCategory.has(key)) byCategory.set(key, []);
        byCategory.get(key)!.push(fila);
      }

      for (const [categoryId, rows] of byCategory) {
        const categoryRef = doc(db, "catalog", categoryId);
        const snap = await getDoc(categoryRef);
        const products: any[] = snap.exists() ? (snap.data().products ?? []) : [];

        for (const fila of rows) {
          const nombre = String(fila.nombre).trim();
          const idx = products.findIndex(
            (p) => p.name.toLowerCase() === nombre.toLowerCase()
          );

          if (idx !== -1) {
            products[idx] = {
              ...products[idx],
              price: String(fila.precio),
              stock: Number(fila.stock) || 0,
              stockMinimo: Number(fila.stockMinimo) || 0,
              ...(fila.barcode !== undefined && fila.barcode !== ""
                ? { barcode: String(fila.barcode) }
                : {}),
            };
            updated++;
          } else {
            const slug = nombre
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, "");
            products.push({
              id: `${categoryId}-${slug}`,
              name: nombre,
              barcode: fila.barcode ? String(fila.barcode) : "",
              price: String(fila.precio),
              stock: Number(fila.stock) || 0,
              stockMinimo: Number(fila.stockMinimo) || 0,
              inStock: true,
              aiHint: "",
            });
            created++;
          }
        }

        await setDoc(categoryRef, { products }, { merge: true });
      }

      toast({
        title: "Importación completada",
        description: `${updated} producto${updated !== 1 ? "s" : ""} actualizados, ${created} creado${created !== 1 ? "s" : ""}.`,
      });
    } catch (error: any) {
      console.error("[InventoryExcel] import error:", error);
      toast({
        title: "Error al importar",
        description: error.message ?? "No se pudo procesar el archivo.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Inventario Excel</CardTitle>
        <CardDescription>
          Exporta el catálogo completo a .xlsx o importa cambios masivos de stock, precios y códigos de barras.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-4">
        <Button variant="outline" onClick={handleExport} disabled={categories.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Descargar Excel
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={handleImport}
          disabled={importing}
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
        >
          <Upload className="mr-2 h-4 w-4" />
          {importing ? "Importando..." : "Importar Excel"}
        </Button>
      </CardContent>
    </Card>
  );
}
