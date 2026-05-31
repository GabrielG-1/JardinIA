
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  getDoc,
  arrayUnion,
} from "firebase/firestore";

const CATALOG_COLLECTION = "catalog";

export type Product = {
  id: string;
  name: string;
  price: string;
  image: string;
  aiHint?: string;
  inStock?: boolean;
  stock?: number;
  barcode?: string;
  stockMinimo?: number;
};

export type Category = {
  id:string;
  name: string;
  icon: string;
  products: Product[];
};

/**
 * Creates a stable, unique ID for a product based on its category and name.
 * A simple hash is added to ensure uniqueness even with similar names.
 * @param categoryId The ID of the category.
 * @param productName The name of the product.
 * @returns A unique identifier string.
 */
const generateStableProductId = (categoryId: string, productName: string): string => {
    const safeName = productName
        .toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^a-z0-9-]/g, ''); // Remove special characters except letters, numbers, and dashes

    // Basic hash function to add more uniqueness
    let hash = 0;
    for (let i = 0; i < productName.length; i++) {
        const char = productName.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    const shortHash = Math.abs(hash).toString(36).substring(0, 5);

    return `${categoryId}-${safeName}-${shortHash}`;
}

/**
 * Fetches the entire product catalog from Firestore once.
 * This is not a real-time listener.
 * @returns A promise that resolves to an array of categories.
 */
export const getCatalog = async (): Promise<Category[]> => {
    try {
        const q = query(collection(db, CATALOG_COLLECTION));
        const querySnapshot = await getDocs(q);

        const categories: Category[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const catId = doc.id;

            const products = Array.isArray(data.products)
                ? data.products.map((p: any, idx: number) => ({
                    ...p,
                    id: p.id || `${catId}-p-${idx}`,
                    inStock: p.inStock !== false,
                }))
                : [];

            categories.push({
                id: catId,
                ...data,
                products: products
            } as Category);
        });

        return categories;
    } catch (error) {
        console.error("Error fetching catalog: ", error);
        throw error; // Re-throw the error to be handled by the caller
    }
};


/**
 * Searches for products across all categories whose name includes the query term.
 * @param query - The term to search for in product names.
 * @returns A promise that resolves to an array of matching products.
 */
export const searchProducts = async (queryTerm: string): Promise<Product[]> => {
    if (!queryTerm) return [];
    
    const lowercasedQuery = queryTerm.toLowerCase().trim();
    if (lowercasedQuery.length < 2) return []; // Lowered threshold for better results
    
    const allCategories = await getCatalog();
    const allProducts = allCategories.flatMap(category => category.products);

    const matchingProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(lowercasedQuery)
    );

    return matchingProducts;
}

/**
 * Updates a specific product's data (name, price, image, stock).
 * @param categoryId The ID of the category containing the product.
 * @param productId The original ID of the product to update.
 * @param updatedData An object with the new product data.
 */
export const updateProduct = async (
    categoryId: string,
    productId: string,
    updatedData: {
        name: string;
        price: string;
        image: string;
        inStock?: boolean;
        barcode?: string;
        stock?: number;
        stockMinimo?: number;
    }
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
            if (p.id === productId) {
                productFound = true;
                return {
                  ...p,
                  name: updatedData.name,
                  price: updatedData.price,
                  image: updatedData.image,
                  inStock: typeof updatedData.inStock === 'boolean' ? updatedData.inStock : p.inStock,
                  ...(updatedData.barcode !== undefined ? { barcode: updatedData.barcode } : {}),
                  ...(updatedData.stock !== undefined ? { stock: updatedData.stock } : {}),
                  ...(updatedData.stockMinimo !== undefined ? { stockMinimo: updatedData.stockMinimo } : {}),
                };
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

/**
 * Adds a new product to a specific category.
 * @param categoryId The ID of the category to add the product to.
 * @param newProductData The product object to add. Note: it should not have an id, one will be generated.
 */
export const addProductToCategory = async (categoryId: string, newProductData: Omit<Product, 'id' | 'inStock'>) => {
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

        // We use updateDoc with arrayUnion instead of overwriting the whole array
        // to avoid race conditions if another admin is editing at the same time.
        await updateDoc(categoryRef, {
            products: arrayUnion(productToAdd)
        });
        
        console.log(`Producto "${newProductData.name}" añadido a la categoría "${categoryId}".`);

    } catch (error) {
        console.error("Error al añadir el producto:", error);
        throw error; // Re-throw to be caught by the caller
    }
};

/**
 * Deletes a product from a category.
 * This function reconstructs the array, which is safer than arrayRemove for objects.
 * @param categoryId The ID of the category containing the product.
 * @param productId The ID of the product to delete.
 */
export const deleteProduct = async (categoryId: string, productId: string) => {
    try {
        const categoryRef = doc(db, CATALOG_COLLECTION, categoryId);
        const categorySnap = await getDoc(categoryRef);

        if (!categorySnap.exists()) {
            throw new Error(`Category with id ${categoryId} not found.`);
        }
        
        const categoryData = categorySnap.data() as Omit<Category, 'id'>;
        const products = categoryData.products || [];
        
        // Filter out the product to be deleted
        const updatedProducts = products.filter(p => p.id !== productId);

        if (products.length === updatedProducts.length) {
            console.warn(`Product with id ${productId} not found in category ${categoryId} for deletion.`);
            // No need to throw an error, just means the product was already gone.
            return;
        }

        // Overwrite the products array with the new filtered array
        await updateDoc(categoryRef, {
            products: updatedProducts
        });
    } catch (error) {
        console.error("Error deleting product: ", error);
        throw error;
    }
}
