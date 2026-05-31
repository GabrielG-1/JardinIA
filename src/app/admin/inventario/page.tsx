"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  findProductByBarcode,
  registerStockMovement,
  getTodayMovements,
} from "@/services/inventory-service";
import { type Product } from "@/services/catalog-service";
import { type StockMovement, type MovementType } from "@/types/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Barcode, PackagePlus, PackageMinus, SlidersHorizontal, CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BarcodeCameraScanner } from "@/components/admin/barcode-camera-scanner";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(createdAt: string): string {
  return new Date(createdAt).toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const MOVEMENT_STYLES: Record<MovementType, { label: string; className: string }> = {
  entrada: { label: "Entrada",  className: "bg-green-100 text-green-800 border-green-200" },
  salida:  { label: "Salida",   className: "bg-red-100 text-red-800 border-red-200" },
  ajuste:  { label: "Ajuste",   className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
};

// ---------------------------------------------------------------------------
// BarcodeScanner
// ---------------------------------------------------------------------------

interface BarcodeScannerProps {
  onProductFound: (product: Product, categoryId: string) => void;
}

function BarcodeScanner({ onProductFound }: BarcodeScannerProps) {
  const [barcode, setBarcode] = useState("");
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const search = async (value: string) => {
    const code = value.trim();
    if (!code) return;

    setSearching(true);
    setNotFound(false);
    try {
      const result = await findProductByBarcode(code);
      if (result) {
        onProductFound(result.product, result.categoryId);
        setBarcode("");
      } else {
        setNotFound(true);
        toast({
          title: "Producto no encontrado",
          description: `No existe ningún producto con código "${code}".`,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error al buscar",
        description: "No se pudo consultar el catálogo. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(barcode);
  };

  const handleCameraScan = (code: string) => {
    setBarcode(code);
    search(code);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Barcode className="h-5 w-5 text-primary" />
          Escáner de Código de Barras
        </CardTitle>
        <CardDescription>
          Usa un lector USB/Bluetooth, escribe el código manualmente, o escanea con la cámara.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Input
            ref={inputRef}
            value={barcode}
            onChange={(e) => { setBarcode(e.target.value); setNotFound(false); }}
            placeholder="Escanea o escribe el código..."
            disabled={searching}
            className={notFound ? "border-destructive" : ""}
            autoComplete="off"
          />
          <Button type="submit" disabled={searching || !barcode.trim()}>
            {searching ? "Buscando..." : "Buscar"}
          </Button>
        </form>
        {notFound && (
          <p className="flex items-center gap-1 text-sm text-destructive">
            <XCircle className="h-4 w-4" /> Código no encontrado en el catálogo.
          </p>
        )}
        <BarcodeCameraScanner onScan={handleCameraScan} />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// MovementForm
// ---------------------------------------------------------------------------

interface MovementFormProps {
  product: Product;
  categoryId: string;
  onConfirmed: () => void;
  onClear: () => void;
}

function MovementForm({ product, categoryId, onConfirmed, onClear }: MovementFormProps) {
  const [movementType, setMovementType] = useState<MovementType>("entrada");
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const imageUrl =
    product.image && product.image.startsWith("http")
      ? product.image
      : "https://placehold.co/200x200.png";

  const handleConfirm = async () => {
    if (quantity <= 0) {
      toast({ title: "Cantidad inválida", description: "La cantidad debe ser mayor a 0.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const movement = await registerStockMovement({
        product,
        categoryId,
        type: movementType,
        quantity,
        note: note.trim() || undefined,
      });

      const labels = { entrada: "sumado", salida: "descontado", ajuste: "ajustado" };
      toast({
        title: "Movimiento registrado",
        description: `Stock ${labels[movementType]}. Nuevo stock de "${product.name}": ${movement.stockNuevo}.`,
      });

      onConfirmed();
    } catch {
      toast({
        title: "Error al registrar",
        description: "No se pudo guardar el movimiento. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Image
              src={imageUrl}
              alt={product.name}
              width={64}
              height={64}
              className="rounded-md object-cover border"
            />
            <div>
              <CardTitle className="text-lg">{product.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Stock actual:{" "}
                <span className="font-bold text-foreground">
                  {product.stock ?? 0}
                </span>
                {product.stockMinimo !== undefined && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (mínimo: {product.stockMinimo})
                  </span>
                )}
              </p>
              {product.barcode && (
                <p className="text-xs text-muted-foreground">Código: {product.barcode}</p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClear} className="shrink-0">
            Cambiar producto
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tipo de movimiento */}
        <div>
          <p className="text-sm font-medium mb-2">Tipo de movimiento</p>
          <div className="flex gap-2">
            {(["entrada", "salida", "ajuste"] as MovementType[]).map((type) => {
              const icons = {
                entrada: <PackagePlus className="h-4 w-4" />,
                salida:  <PackageMinus className="h-4 w-4" />,
                ajuste:  <SlidersHorizontal className="h-4 w-4" />,
              };
              const active = movementType === type;
              return (
                <Button
                  key={type}
                  variant={active ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMovementType(type)}
                  className={
                    active
                      ? type === "entrada" ? "bg-green-600 hover:bg-green-700"
                        : type === "salida" ? "bg-red-600 hover:bg-red-700"
                        : "bg-yellow-500 hover:bg-yellow-600 text-white"
                      : ""
                  }
                >
                  {icons[type]}
                  <span className="ml-1 capitalize">{type}</span>
                </Button>
              );
            })}
          </div>
          {movementType === "ajuste" && (
            <p className="text-xs text-muted-foreground mt-1">
              El ajuste reemplaza el stock actual con el valor ingresado.
            </p>
          )}
        </div>

        {/* Cantidad */}
        <div className="flex items-center gap-4">
          <div className="w-40">
            <p className="text-sm font-medium mb-2">
              {movementType === "ajuste" ? "Nuevo stock" : "Cantidad"}
            </p>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
          {movementType !== "ajuste" && (
            <div className="pt-6 text-sm text-muted-foreground">
              → Stock resultante:{" "}
              <span className="font-bold text-foreground">
                {movementType === "entrada"
                  ? (product.stock ?? 0) + quantity
                  : Math.max(0, (product.stock ?? 0) - quantity)}
              </span>
            </div>
          )}
        </div>

        {/* Nota opcional */}
        <div>
          <p className="text-sm font-medium mb-2">Nota (opcional)</p>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej: Reposición semanal, merma por vencimiento..."
            maxLength={200}
          />
        </div>

        <Button
          className="w-full"
          onClick={handleConfirm}
          disabled={submitting}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          {submitting ? "Registrando..." : "Confirmar movimiento"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// MovementsList
// ---------------------------------------------------------------------------

interface MovementsListProps {
  movements: StockMovement[];
  loading: boolean;
}

function MovementsList({ movements, loading }: MovementsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Movimientos de hoy
        </CardTitle>
        <CardDescription>Últimos 10 registros del día actual.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : movements.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">
            Sin movimientos registrados hoy.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {movements.slice(0, 10).map((m) => {
              const style = MOVEMENT_STYLES[m.type];
              return (
                <div key={m.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="flex-grow min-w-0">
                    <p className="font-medium text-sm truncate">{m.productName}</p>
                    {m.note && (
                      <p className="text-xs text-muted-foreground truncate">{m.note}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="outline" className={style.className}>
                      {style.label}
                    </Badge>
                    <span className="text-sm font-bold w-10 text-right">
                      {m.type === "salida" ? "-" : "+"}{m.quantity}
                    </span>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {formatTime(m.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function InventarioPage() {
  const { user, isAdmin, isAuthLoading, signOut } = useAuth();
  const router = useRouter();

  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [scannedCategoryId, setScannedCategoryId] = useState<string>("");
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(true);

  const fetchMovements = useCallback(async () => {
    setMovementsLoading(true);
    try {
      const data = await getTodayMovements();
      setMovements(data);
    } finally {
      setMovementsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading && (!user || !isAdmin)) {
      router.replace("/admin");
    }
  }, [user, isAdmin, isAuthLoading, router]);

  useEffect(() => {
    if (isAdmin) fetchMovements();
  }, [isAdmin, fetchMovements]);

  const handleProductFound = (product: Product, categoryId: string) => {
    setScannedProduct(product);
    setScannedCategoryId(categoryId);
  };

  const handleMovementConfirmed = () => {
    setScannedProduct(null);
    setScannedCategoryId("");
    fetchMovements();
  };

  const handleClear = () => {
    setScannedProduct(null);
    setScannedCategoryId("");
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="container mx-auto px-4 md:px-8 pb-8 bg-muted/20 min-h-screen pt-36">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold font-headline">Control de Inventario</h1>
            {user && (
              <p className="text-muted-foreground truncate">
                Sesión iniciada como {user.email}
              </p>
            )}
          </div>
        </div>
        <Button onClick={signOut} variant="destructive">
          Cerrar Sesión
        </Button>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna izquierda: escáner + formulario */}
        <div className="space-y-6">
          {!scannedProduct ? (
            <BarcodeScanner onProductFound={handleProductFound} />
          ) : (
            <MovementForm
              product={scannedProduct}
              categoryId={scannedCategoryId}
              onConfirmed={handleMovementConfirmed}
              onClear={handleClear}
            />
          )}
        </div>

        {/* Columna derecha: movimientos del día */}
        <div>
          <MovementsList movements={movements} loading={movementsLoading} />
        </div>
      </main>
    </div>
  );
}
