
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

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


/**
 * Uploads the site logo to a specific path in Firebase Storage and updates the URL in Firestore.
 * @param file The logo file to upload.
 * @returns A promise that resolves with the public download URL of the uploaded logo.
 */
export const uploadLogo = async (file: File): Promise<string> => {
  // Use a fixed path to ensure there's only one logo file, which gets overwritten.
  const filePath = `site-settings/logo`;
  const storageRef = ref(storage, filePath);
  
  // Upload the file, overwriting the existing one if it exists
  await uploadBytes(storageRef, file, { contentType: file.type });

  // Get the download URL
  const downloadURL = await getDownloadURL(storageRef);
  
  // Save the URL to Firestore for easy access on the client-side
  await setDoc(
    doc(db, "settings", "siteConfig"),
    { logoUrl: downloadURL, updatedAt: serverTimestamp() },
    { merge: true }
  );

  return downloadURL;
};
