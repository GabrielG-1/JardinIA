import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  where,
} from "firebase/firestore";
import { type Product } from "@/services/catalog-service";
import { type StockMovement, type MovementType } from "@/types/inventory";

const CATALOG_COLLECTION = "catalog";
const MOVEMENTS_COLLECTION = "stock_movements";

// ---------------------------------------------------------------------------
// findProductByBarcode
// ---------------------------------------------------------------------------

export const findProductByBarcode = async (
  barcode: string
): Promise<{ product: Product; categoryId: string } | null> => {
  const snapshot = await getDocs(collection(db, CATALOG_COLLECTION));

  for (const docSnap of snapshot.docs) {
    const products: Product[] = docSnap.data().products ?? [];
    const found = products.find((p) => p.barcode === barcode);
    if (found) return { product: found, categoryId: docSnap.id };
  }

  return null;
};

// ---------------------------------------------------------------------------
// registerStockMovement
// ---------------------------------------------------------------------------

type RegisterMovementParams = {
  product: Product;
  categoryId: string;
  type: MovementType;
  quantity: number;
  note?: string;
};

export const registerStockMovement = async ({
  product,
  categoryId,
  type,
  quantity,
  note,
}: RegisterMovementParams): Promise<StockMovement> => {
  const stockAnterior = product.stock ?? 0;

  let stockNuevo: number;
  if (type === "entrada") {
    stockNuevo = stockAnterior + quantity;
  } else if (type === "salida") {
    stockNuevo = Math.max(0, stockAnterior - quantity);
  } else {
    // "ajuste" — reemplaza el stock directamente
    stockNuevo = quantity;
  }

  // Actualiza el producto dentro del array en Firestore
  const categoryRef = doc(db, CATALOG_COLLECTION, categoryId);
  const categorySnap = await getDoc(categoryRef);

  if (!categorySnap.exists()) {
    throw new Error(`Categoría "${categoryId}" no encontrada.`);
  }

  const products: Product[] = categorySnap.data().products ?? [];
  const updatedProducts = products.map((p) =>
    p.id === product.id
      ? { ...p, stock: stockNuevo, inStock: stockNuevo > 0 }
      : p
  );

  await updateDoc(categoryRef, { products: updatedProducts });

  const createdAt = new Date().toISOString();
  const movementData: Omit<StockMovement, "id"> = {
    productId: product.id,
    productName: product.name,
    categoryId,
    type,
    quantity,
    stockAnterior,
    stockNuevo,
    createdAt,
    ...(note ? { note } : {}),
  };

  const docRef = await addDoc(collection(db, MOVEMENTS_COLLECTION), movementData);

  return { id: docRef.id, ...movementData };
};

// ---------------------------------------------------------------------------
// getRecentMovements
// ---------------------------------------------------------------------------

export const getRecentMovements = async (
  limitCount: number
): Promise<StockMovement[]> => {
  const q = query(
    collection(db, MOVEMENTS_COLLECTION),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as StockMovement));
};

// ---------------------------------------------------------------------------
// getTodayMovements
// ---------------------------------------------------------------------------

export const getTodayMovements = async (): Promise<StockMovement[]> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const q = query(
    collection(db, MOVEMENTS_COLLECTION),
    where("createdAt", ">=", startOfDay.toISOString()),
    where("createdAt", "<=", endOfDay.toISOString()),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as StockMovement));
};

// ---------------------------------------------------------------------------
// getLowStockProducts
// ---------------------------------------------------------------------------

export const getLowStockProducts = async (): Promise<
  { product: Product; categoryId: string }[]
> => {
  const snapshot = await getDocs(collection(db, CATALOG_COLLECTION));
  const result: { product: Product; categoryId: string }[] = [];

  for (const docSnap of snapshot.docs) {
    const products: Product[] = docSnap.data().products ?? [];
    for (const product of products) {
      const threshold = product.stockMinimo ?? 3;
      if ((product.stock ?? 0) <= threshold) {
        result.push({ product, categoryId: docSnap.id });
      }
    }
  }

  return result;
};
