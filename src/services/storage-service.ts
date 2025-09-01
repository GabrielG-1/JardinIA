
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
    // Create a storage reference
    const safeProductName = productId.replace(/[^a-zA-Z0-9-]/g, '_').toLowerCase();
    const filePath = `product-images/${safeProductName}-${Date.now()}-${file.name}`;
    const storageRef = ref(storage, filePath);

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;

  } catch (error) {
    console.error("Error uploading product image to Storage:", error);
    // This allows the calling component to catch the specific Firebase error
    throw error;
  }
};


/**
 * Uploads the site logo to a specific path in Firebase Storage and updates the path in Firestore.
 * @param file The logo file to upload.
 * @returns A promise that resolves with the public download URL of the uploaded logo.
 */
export const uploadSiteLogo = async (file: File): Promise<string> => {
  const filePath = "site-settings/logo"; // Fixed path for the logo
  const logoRef = ref(storage, filePath);

  try {
    // Upload the file, overwriting if it exists
    const uploadResult = await uploadBytes(logoRef, file, { contentType: file.type });

    // Save the file's path to Firestore for easy client-side access
    await updateLogoPath(uploadResult.ref.fullPath);
    
    // Get the public URL for the image to return it to the client for immediate update
    const url = await getDownloadURL(uploadResult.ref);

    return url;
  } catch (error) {
    console.error("Error uploading site logo to Storage:", error);
    throw error;
  }
};
