
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

const searchMap: Record<string, string[]> = {
    pulgones: ['pulgones', 'insecticida', 'tox', 'kil', 'dimetoato', 'jab'],
    oidio: ['oidio', 'hongo', 'fungicida', 'cobre'],
    'deficiencia de nitrogeno': ['nitrogeno', 'urea', 'fertilizante', 'abono', '11-30-11'],
    'arana roja': ['arana roja', 'acaro', 'acaricida', 'mite', 'insecticida', 'jabon potasico'],
    'cochinilla algodonosa': ['cochinilla', 'insecticida', 'aceite', 'jabon potasico'],
    'mosca blanca': ['mosca blanca', 'insecticida', 'neem', 'trampa'],
};

/**
 * Expands a simple query into a list of search terms based on a predefined map.
 * @param query The simple query (e.g., 'pulgones').
 * @returns A list of terms to search for.
 */
export const expandQuery = (query: string): string[] => {
    const lowercasedQuery = query.toLowerCase();
    
    // Find the key in the searchMap that the query contains
    const matchingKey = Object.keys(searchMap).find(key => lowercasedQuery.includes(key));

    if (matchingKey) {
        return searchMap[matchingKey];
    }
    
    // Fallback to the original query if no match is found
    return [lowercasedQuery];
};


/**
 * Searches for products across all categories using a list of search terms.
 * This is a basic implementation of full-text search.
 * @param searchTerms - The terms to search for in product names.
 * @returns A promise that resolves to an array of matching products.
 */
export const searchProducts = async (searchTerms: string[]): Promise<Product[]> => {
    const q = query(collection(db, CATALOG_COLLECTION));
    const querySnapshot = await getDocs(q);
    const allProducts: Product[] = [];
    
    const uniqueProducts = new Set<string>();

    querySnapshot.forEach((doc) => {
        const category = doc.data() as Omit<Category, 'id'>;
        if (Array.isArray(category.products)) {
            const matchingProducts = category.products.filter(product => {
                const productNameLower = product.name.toLowerCase();
                // If product already added, skip it
                if (uniqueProducts.has(productNameLower)) {
                    return false;
                }
                // Check if product name includes any of the search terms
                if (searchTerms.some(term => productNameLower.includes(term))) {
                    uniqueProducts.add(productNameLower);
                    return true;
                }
                return false;
            });
            allProducts.push(...matchingProducts);
        }
    });

    return allProducts;
}


/**
 * Updates the image URL for a specific product within a category.
 * @param categoryId The ID of the category containing the product.
 * @param productName The name of the product to update.
 * @param newImageUrl The new image URL for the product.
 */
export const updateProductImage = async (categoryId: string, productName: string, newImageUrl: string) => {
    try {
        const categoryRef = doc(db, CATALOG_COLLECTION, categoryId);
        const categorySnap = await getDoc(categoryRef);

        if (!categorySnap.exists()) {
            throw new Error(`Category with id ${categoryId} not found.`);
        }
        
        const categoryData = categorySnap.data() as Omit<Category, 'id'>;
        const products = categoryData.products || [];

        const productIndex = products.findIndex(p => p.name === productName);

        if (productIndex === -1) {
            throw new Error(`Product with name ${productName} not found in category ${categoryId}.`);
        }

        // Create a new array with the updated product
        const updatedProducts = [
            ...products.slice(0, productIndex),
            { ...products[productIndex], image: newImageUrl },
            ...products.slice(productIndex + 1),
        ];

        // Update the 'products' field in the document
        await updateDoc(categoryRef, { products: updatedProducts });

    } catch (error) {
        console.error("Error updating product image: ", error);
        throw error;
    }
}
