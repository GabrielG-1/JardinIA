import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Uploads a product image to Firebase Storage.
 * @param file The image file to upload.
 * @param productName The name of the product, used for generating the file path.
 * @returns A promise that resolves with the public download URL of the uploaded image.
 */
export const uploadProductImage = async (file: File, productName: string): Promise<string> => {
  // Create a storage reference
  const safeProductName = productName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const filePath = `product-images/${safeProductName}-${Date.now()}-${file.name}`;
  const storageRef = ref(storage, filePath);

  // Upload the file
  const snapshot = await uploadBytes(storageRef, file);

  // Get the download URL
  const downloadURL = await getDownloadURL(snapshot.ref);

  return downloadURL;
};
