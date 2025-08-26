
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
  arrayUnion,
} from "firebase/firestore";

const CATALOG_COLLECTION = "catalog";

export type Product = {
  id: string; // ID is now mandatory
  name: string;
  price: string;
  image: string;
  aiHint?: string;
  inStock?: boolean;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  products: Product[];
};

/**
 * Creates a stable, unique ID for a product based on its category and name.
 * This is used to ensure consistency if products in Firestore don't have a persistent ID.
 * @param categoryId The ID of the category.
 * @param productName The name of the product.
 * @returns A unique identifier string.
 */
const generateStableProductId = (categoryId: string, productName: string): string => {
    const safeName = productName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `${categoryId}-${safeName}`;
}


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
        // Ensure each product has a unique ID, defaulting to a generated one if not present
        const productsWithIds = (data.products || []).map((p: Product) => ({
            ...p,
            inStock: p.inStock !== false, // Default to true if undefined
            id: p.id || generateStableProductId(doc.id, p.name)
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
          const productsWithCategory = category.products.map((p) => ({ 
              ...p, 
              inStock: p.inStock !== false, // Default to true
              id: p.id || generateStableProductId(doc.id, p.name)
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

const updateProductField = async (categoryId: string, productId: string, field: string, value: any) => {
    const categoryRef = doc(db, CATALOG_COLLECTION, categoryId);
    const categorySnap = await getDoc(categoryRef);

    if (!categorySnap.exists()) {
        throw new Error(`Category with id ${categoryId} not found.`);
    }
    
    const categoryData = categorySnap.data() as Omit<Category, 'id'>;
    const products = categoryData.products || [];
    
    let productFound = false;
    const updatedProducts = products.map(p => {
        // Ensure every product being iterated has an ID for comparison
        const currentProductId = p.id || generateStableProductId(categoryId, p.name);
        if (currentProductId === productId) {
            productFound = true;
            return { ...p, id: currentProductId, [field]: value };
        }
        return { ...p, id: currentProductId };
    });

    if (!productFound) {
        throw new Error(`Product with id ${productId} not found in category ${categoryId}.`);
    }

    await updateDoc(categoryRef, { products: updatedProducts });
};


/**
 * Updates the image URL for a specific product within a category.
 * @param categoryId The ID of the category containing the product.
 * @param productId The ID of the product to update.
 * @param newImageUrl The new image URL for the product.
 */
export const updateProductImage = async (categoryId: string, productId: string, newImageUrl: string) => {
    try {
        await updateProductField(categoryId, productId, 'image', newImageUrl);
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
            const currentProductId = p.id || generateStableProductId(categoryId, p.name);
            if (currentProductId === productId) {
                productFound = true;
                return { ...p, ...updatedData, id: currentProductId };
            }
            return { ...p, id: currentProductId };
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

/**
 * Updates the stock status for a specific product.
 * @param categoryId The ID of the category containing the product.
 * @param productId The ID of the product to update.
 * @param inStock The new stock status (boolean).
 */
export const updateProductStockStatus = async (categoryId: string, productId: string, inStock: boolean) => {
    try {
        await updateProductField(categoryId, productId, 'inStock', inStock);
    } catch (error) {
        console.error("Error updating product stock status: ", error);
        throw error;
    }
};

/**
 * Adds a new product to a specific category.
 * @param categoryId The ID of the category to add the product to.
 * @param newProductData The product object to add. Note: it should not have an id, one will be generated.
 */
export const addProductToCategory = async (categoryId: string, newProductData: Omit<Product, 'id'>) => {
    if (!categoryId) {
        throw new Error("El ID de la categoría es requerido.");
    }
    try {
        const categoryRef = doc(db, CATALOG_COLLECTION, categoryId);
        
        const productToAdd: Product = {
            ...newProductData,
            id: generateStableProductId(categoryId, newProductData.name),
            inStock: true, // New products are in stock by default
        };

        await updateDoc(categoryRef, {
            products: arrayUnion(productToAdd)
        });
        
        console.log(`Producto "${newProductData.name}" añadido a la categoría "${categoryId}".`);

    } catch (error) {
        console.error("Error al añadir el producto:", error);
        throw error; // Re-throw to be caught by the caller
    }
};
