
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
 * Searches for products across all categories.
 * @param searchTerm - The term to search for in product names.
 * @returns A promise that resolves to an array of matching products.
 */
export const searchProducts = async (searchTerm: string): Promise<Product[]> => {
    const q = query(collection(db, CATALOG_COLLECTION));
    const querySnapshot = await getDocs(q);
    const allProducts: Product[] = [];
    const lowercasedSearchTerm = searchTerm.toLowerCase();

    // Map of diagnostics to more generic search terms
    const searchMap: { [key: string]: string[] } = {
        'insecticida': ['tox', 'kil', 'dimetoato', 'jab', 'insecticida'],
        'fungicida': ['hongos', 'cobre', 'oidio', 'fungicida'],
        'fertilizante': ['urea', 'mezcla', 'fosfato', 'salkitre', 'abono', 'fertilizante'],
    };

    const searchTerms = searchMap[lowercasedSearchTerm] || [lowercasedSearchTerm];

    querySnapshot.forEach((doc) => {
        const category = doc.data() as Omit<Category, 'id'>;
        if (Array.isArray(category.products)) {
            const matchingProducts = category.products.filter(product => 
                searchTerms.some(term => product.name.toLowerCase().includes(term))
            );
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
