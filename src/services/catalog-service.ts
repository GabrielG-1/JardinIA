
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import type { LucideIcon } from "lucide-react";

const CATALOG_COLLECTION = "catalog";

export type Product = {
  name: string;
  price: string;
  image: string;
  aiHint?: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  products: Product[];
};

/**
 * Listens for real-time updates to the catalog collection.
 * @param callback - A function to be called with the updated list of categories.
 * @returns An unsubscribe function to detach the listener.
 */
export const getCatalog = (callback: (categories: Category[]) => void): Unsubscribe => {
  const q = query(collection(db, CATALOG_COLLECTION));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const categories: Category[] = [];
    querySnapshot.forEach((doc) => {
      categories.push({ id: doc.id, ...doc.data() } as Category);
    });
    callback(categories);
  }, (error) => {
    console.error("Error fetching catalog: ", error);
    // You could pass the error to the callback to display a more specific message
    callback([]);
  });

  return unsubscribe;
};

/**
 * Searches for products across all categories.
 * @param searchTerm - The term to search for in product names.
 * @returns A promise that resolves to an array of matching products.
 */
export const searchProducts = async (searchTerm: string): Promise<Product[]> => {
    const q = query(collection(db, CATALOG_COLLECTION));
    const querySnapshot = await getDocs(q);
    const allProducts: Product[] = [];
    const lowercasedSearchTerm = searchTerm.toLowerCase();

    querySnapshot.forEach((doc) => {
        const category = doc.data() as Omit<Category, 'id'>;
        if (Array.isArray(category.products)) {
            const matchingProducts = category.products.filter(product => 
                product.name.toLowerCase().includes(lowercasedSearchTerm)
            );
            allProducts.push(...matchingProducts);
        }
    });

    return allProducts;
}


export const updateCategoryProducts = async (categoryId: string, products: Product[]) => {
    try {
        const categoryRef = doc(db, CATALOG_COLLECTION, categoryId);
        await updateDoc(categoryRef, { products });
    } catch (error) {
        console.error("Error updating category products: ", error);
        throw error;
    }
}
