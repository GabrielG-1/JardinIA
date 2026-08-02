"use client";

import { useState, useMemo } from "react";
import { type Category } from "@/services/catalog-service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, AlertTriangle, Package } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StockTableProps {
  categories: Category[];
}

export function StockTable({ categories }: StockTableProps) {
  const [search, setSearch] = useState("");
  const [filterLow, setFilterLow] = useState(false);
  const [filterCategory, setFilterCategory] = useState("todas");

  const allProducts = useMemo(() => {
    return categories.flatMap((cat) =>
      (cat.products ?? []).map((p) => ({
        ...p,
        categoryName: cat.name,
      }))
    );
  }, [categories]);

  const categoryNames = useMemo(
    () => Array.from(new Set(allProducts.map((p) => p.categoryName))).sort(),
    [allProducts]
  );

  const filtered = useMemo(() => {
    let result = allProducts;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q)
      );
    }
    if (filterCategory !== "todas") {
      result = result.filter((p) => p.categoryName === filterCategory);
    }
    if (filterLow) {
      result = result.filter(
        (p) => p.stockMinimo !== undefined && (p.stock ?? 0) <= p.stockMinimo
      );
    }
    return result.sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));
  }, [allProducts, search, filterCategory, filterLow]);

  const lowStockCount = allProducts.filter(
    (p) => p.stockMinimo !== undefined && (p.stock ?? 0) <= p.stockMinimo
  ).length;

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Stock actual
            </CardTitle>
            <CardDescription>
              {allProducts.length} productos en total
              {lowStockCount > 0 && (
                <span className="ml-2 text-yellow-600 font-medium">
                  · {lowStockCount} con stock bajo
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-52"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                {categoryNames.map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={() => setFilterLow(!filterLow)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                filterLow
                  ? "bg-yellow-100 border-yellow-400 text-yellow-800"
                  : "bg-card border-border text-muted-foreground hover:border-yellow-400"
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              Stock bajo
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Producto</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Categoría</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Stock</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Mínimo</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    No se encontraron productos.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const stock = p.stock ?? 0;
                  const min = p.stockMinimo;
                  const isLow = min !== undefined && stock <= min;
                  const isOut = stock === 0;
                  return (
                    <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 px-3 font-medium">{p.name}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{p.categoryName}</td>
                      <td className="py-2.5 px-3 text-right font-bold">{stock}</td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">
                        {min ?? "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {isOut ? (
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                            Sin stock
                          </Badge>
                        ) : isLow ? (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                            Stock bajo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                            OK
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
