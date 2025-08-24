
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

/**
 * Searches for products across all categories using a smart query.
 * It looks for the query term and related generic terms (e.g., 'insecticida').
 * @param query - The diagnosis term to search for.
 * @returns A promise that resolves to an array of matching products.
 */
export const searchProducts = async (query: string): Promise<Product[]> => {
    const lowercasedQuery = query.toLowerCase();
    
    // This map connects diagnoses to generic search terms.
    const genericTermMap: Record<string, string[]> = {
        'pulgones': ['insecticida', 'jabon'],
        'oidio': ['fungicida', 'cobre'],
        'deficiencia de nitrogeno': ['fertilizante', 'abono', 'urea'],
        'deficiencia de': ['fertilizante', 'abono'],
        'araña roja': ['acaricida', 'insecticida', 'jabon'],
        'cochinilla': ['insecticida', 'jabon'],
        'mosca blanca': ['insecticida', 'jabon'],
        'hongo': ['fungicida']
    };

    // Find the key in the map that the query contains.
    const matchingKey = Object.keys(genericTermMap).find(key => lowercasedQuery.includes(key));
    
    // Start with the original query term, split into words.
    let searchTerms = lowercasedQuery.split(/\s+/);

    // If a matching key is found, add the corresponding generic terms.
    if (matchingKey) {
        searchTerms.push(...genericTermMap[matchingKey]);
    }
    
    // Make terms unique to avoid redundant checks
    const uniqueSearchTerms = [...new Set(searchTerms)];
    console.log(`Searching with terms: ${uniqueSearchTerms.join(', ')}`);
    
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
                if (uniqueProducts.has(product.name)) {
                    return false;
                }

                // Check if product name includes any of the search terms
                if (uniqueSearchTerms.some(term => productNameLower.includes(term))) {
                    uniqueProducts.add(product.name);
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
