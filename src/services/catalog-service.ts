
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  type Unsubscribe,
  getDoc,
} from "firebase/firestore";
import type { LucideIcon } from "lucide-react";

const CATALOG_COLLECTION = "catalog";

export type Product = {
  id?: string;
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
 * @param onError - An optional function to handle errors.
 * @returns An unsubscribe function to detach the listener.
 */
export const getCatalog = (
    onSuccess: (categories: Category[]) => void, 
    onError?: (error: Error) => void
): Unsubscribe => {
  const q = query(collection(db, CATALOG_COLLECTION));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const categories: Category[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Ensure each product has a unique ID, defaulting to its name if not present
        const productsWithIds = (data.products || []).map((p: Product, index: number) => ({
            ...p,
            // Use a combination of name and index for a more stable key if id is missing
            id: p.id || `${doc.id}-${index}-${p.name.replace(/\s+/g, '-')}`
        }));

        categories.push({ 
            id: doc.id, 
            ...data,
            products: productsWithIds
        } as Category);
    });
    onSuccess(categories);
  }, (error) => {
    console.error("Error fetching catalog: ", error);
    if (onError) {
        onError(error);
    }
  });

  return unsubscribe;
};


/**
 * Retrieves all products from all categories in the catalog.
 * @returns A promise that resolves to a flat array of all products.
 */
export const getAllProducts = async (): Promise<Product[]> => {
  const q = query(collection(db, CATALOG_COLLECTION));
  const querySnapshot = await getDocs(q);
  const allProducts: Product[] = [];
  
  querySnapshot.forEach((doc) => {
      const category = doc.data() as Omit<Category, 'id'>;
      if (Array.isArray(category.products)) {
          // Add categoryId and ensure a unique ID for each product
          const productsWithCategory = category.products.map((p, index) => ({ 
              ...p, 
              categoryId: doc.id, 
              id: p.id || `${doc.id}-${index}-${p.name.replace(/\s+/g, '-')}`
            }));
          allProducts.push(...productsWithCategory);
      }
  });

  return allProducts;
}

/**
 * Searches for products across all categories whose name includes the query term.
 * @param query - The term to search for in product names.
 * @returns A promise that resolves to an array of matching products.
 */
export const searchProducts = async (queryTerm: string): Promise<Product[]> => {
    if (!queryTerm) return [];
    
    const lowercasedQuery = queryTerm.toLowerCase().trim();
    if (lowercasedQuery.length < 3) return [];
    
    const allProducts = await getAllProducts();

    const matchingProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(lowercasedQuery)
    );

    return matchingProducts;
}


/**
 * Updates the image URL for a specific product within a category.
 * @param categoryId The ID of the category containing the product.
 * @param productId The ID of the product to update.
 * @param newImageUrl The new image URL for the product.
 */
export const updateProductImage = async (categoryId: string, productId: string, newImageUrl: string) => {
    try {
        const categoryRef = doc(db, CATALOG_COLLECTION, categoryId);
        const categorySnap = await getDoc(categoryRef);

        if (!categorySnap.exists()) {
            throw new Error(`Category with id ${categoryId} not found.`);
        }
        
        const categoryData = categorySnap.data() as Omit<Category, 'id'>;
        const products = categoryData.products || [];
        
        let productFound = false;
        const updatedProducts = products.map(p => {
            // Heuristic to match product by id, or by name if id is missing
            const currentProductId = p.id || p.name;
            if (currentProductId === productId) {
                productFound = true;
                return { ...p, image: newImageUrl };
            }
            return p;
        });

        if (!productFound) {
            // Fallback for old data: search by name if ID fails
            const productIndex = products.findIndex(p => p.name === productId);
            if (productIndex !== -1) {
                 updatedProducts[productIndex] = { ...products[productIndex], image: newImageUrl };
                 productFound = true;
            } else {
                 throw new Error(`Product with id or name ${productId} not found in category ${categoryId}.`);
            }
        }

        await updateDoc(categoryRef, { products: updatedProducts });

    } catch (error) {
        console.error("Error updating product image: ", error);
        throw error;
    }
}

/**
 * Updates a specific product's data (name and price).
 * @param categoryId The ID of the category containing the product.
 * @param productId The original ID of the product to update.
 * @param updatedData An object with the new name and price.
 */
export const updateProduct = async (
    categoryId: string, 
    productId: string, 
    updatedData: { name: string; price: string }
) => {
    try {
        const categoryRef = doc(db, CATALOG_COLLECTION, categoryId);
        const categorySnap = await getDoc(categoryRef);

        if (!categorySnap.exists()) {
            throw new Error(`Categoría con id ${categoryId} no encontrada.`);
        }

        const categoryData = categorySnap.data() as Omit<Category, 'id'>;
        const products = categoryData.products || [];
        
        let productFound = false;
        const updatedProducts = products.map(p => {
            const currentProductId = p.id || p.name;
            if (currentProductId === productId) {
                productFound = true;
                return { ...p, ...updatedData };
            }
            return p;
        });
        
        if (!productFound) {
             throw new Error(`Producto con id ${productId} no encontrado en la categoría ${categoryId}.`);
        }

        await updateDoc(categoryRef, { products: updatedProducts });

    } catch (error) {
        console.error("Error al actualizar el producto: ", error);
        throw error;
    }
};
