
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
export const uploadSiteLogo = async (file: File): Promise<string> => {
  const path = "site-settings/logo"; // Fixed path for the logo
  const logoRef = ref(storage, path);

  // Upload the file, overwriting if it exists
  await uploadBytes(logoRef, file, { contentType: file.type });

  // Get the public URL for the image
  const url = await getDownloadURL(logoRef);

  // Save the URL to Firestore for easy client-side access
  await setDoc(
    doc(db, "site-settings", "global"),
    { logoUrl: url, updatedAt: serverTimestamp() },
    { merge: true }
  );

  return url;
};
