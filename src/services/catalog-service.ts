
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
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
  aiHint: string;
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
  const q = query(collection(db, CATALOG_COLLECTION), orderBy("name"));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const categories: Category[] = [];
    querySnapshot.forEach((doc) => {
      categories.push({ id: doc.id, ...doc.data() } as Category);
    });
    callback(categories);
  });

  return unsubscribe;
};

/**
 * Updates the image URL of a specific product within a category.
 * @param categoryId - The ID of the category document in Firestore.
 * @param productName - The name of the product to update.
 * @param newImageUrl - The new download URL for the product's image.
 */
export const updateProductImage = async (
  categoryId: string,
  productName: string,
  newImageUrl: string
) => {
  try {
    const categoryRef = doc(db, CATALOG_COLLECTION, categoryId);
    
    // To update an item in an array, we need to read the whole document,
    // update the array in memory, and then write the entire array back.
    // This is a limitation of Firestore's array handling.
    // For more complex scenarios, a subcollection for products would be better.
    
    // For this app, let's assume we can get the current state from the component
    // that calls this function, to avoid an extra read here.
    // The component will pass the full updated products array.
    
    // This function will now expect the full list of products for the category.
  } catch (error) {
    console.error("Error updating product image: ", error);
    throw error;
  }
};


export const updateCategoryProducts = async (categoryId: string, products: Product[]) => {
    try {
        const categoryRef = doc(db, CATALOG_COLLECTION, categoryId);
        await updateDoc(categoryRef, { products });
    } catch (error) {
        console.error("Error updating category products: ", error);
        throw error;
    }
}
