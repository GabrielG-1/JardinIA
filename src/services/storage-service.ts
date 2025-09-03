
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateLogoPath } from "./settings-service";


/**
 * Uploads a product image to Firebase Storage.
 * @param file The image file to upload.
 * @param productId The ID of the product, used for generating the file path.
 * @returns A promise that resolves with the public download URL of the uploaded image.
 */
export const uploadProductImage = async (file: File, productId: string): Promise<string> => {
  try {
    const safeProductName = productId.replace(/[^a-zA-Z0-9-]/g, '_').toLowerCase();
    const filePath = `product-images/${safeProductName}-${Date.now()}-${file.name}`;
    const storageRef = ref(storage, filePath);

    // INCLUIR METADATOS es crucial para evitar errores de CORS/permisos
    const metadata = {
      contentType: file.type,
    };

    const snapshot = await uploadBytes(storageRef, file, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;

  } catch (error) {
    console.error(`Error uploading product image to Storage. Code: ${(error as any).code}. Message: ${error}`, error);
    throw error;
  }
};


/**
 * Uploads the site logo to a specific path in Firebase Storage and updates the path in Firestore.
 * @param file The logo file to upload.
 * @returns A promise that resolves with the public download URL of the uploaded logo.
 */
export const uploadSiteLogo = async (file: File): Promise<string> => {
  const filePath = "site-settings/logo";
  const logoRef = ref(storage, filePath);

  try {
    const metadata = {
      contentType: file.type,
    };
    
    const uploadResult = await uploadBytes(logoRef, file, metadata);
    
    // Guardamos la RUTA (no la URL) en Firestore
    await updateLogoPath(uploadResult.ref.fullPath);
    
    const url = await getDownloadURL(uploadResult.ref);

    return url;
  } catch (error) {
     console.error(`Error uploading site logo to Storage. Code: ${(error as any).code}. Message: ${error}`, error);
    throw error;
  }
};
