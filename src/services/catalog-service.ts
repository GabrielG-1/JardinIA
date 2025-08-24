
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
          // Add categoryId to each product for potential future use
          const productsWithCategory = category.products.map(p => ({ ...p, categoryId: doc.id, id: p.name }));
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
    
    const allProducts = await getAllProducts();

    const matchingProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(lowercasedQuery)
    );

    return matchingProducts;
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
