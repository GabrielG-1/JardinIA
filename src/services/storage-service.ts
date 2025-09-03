
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

    // Including metadata is crucial to avoid CORS/permission errors with stricter rules.
    const metadata = {
      contentType: file.type,
    };

    console.log(`Uploading product image to: ${filePath} with type: ${file.type}`);
    const snapshot = await uploadBytes(storageRef, file, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;

  } catch (error: any) {
    console.error(`Error uploading product image. Code: ${error.code}. Message: ${error.message}`, error);
    throw error;
  }
};


/**
 * Uploads the site logo to a specific path in Firebase Storage and updates the path in Firestore.
 * @param file The logo file to upload.
 * @returns A promise that resolves with the public download URL of the uploaded logo.
 */
export const uploadSiteLogo = async (file: File): Promise<string> => {
  // Use a consistent path for the logo to overwrite it. Add a timestamp query to bust caches if needed,
  // but the path itself should be stable.
  const filePath = "site-settings/logo";
  const logoRef = ref(storage, filePath);

  try {
    const metadata = {
      contentType: file.type,
    };
    
    console.log(`Uploading site logo to: ${filePath} with type: ${file.type}`);
    const uploadResult = await uploadBytes(logoRef, file, metadata);
    
    // Save the PATH, not the full URL, to Firestore for consistency.
    await updateLogoPath(uploadResult.ref.fullPath);
    
    const url = await getDownloadURL(uploadResult.ref);

    return url;
  } catch (error: any) {
     console.error(`Error uploading site logo. Code: ${error.code}. Message: ${error.message}`, error);
    throw error;
  }
};
