
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";

const SETTINGS_COLLECTION = "site-settings";
const SITE_CONFIG_DOC = "global"; // A single document for all site-wide settings

/**
 * Retrieves the URL of the site logo from Firestore and Storage.
 * It reads the path from Firestore and gets a download URL from Storage.
 * @returns A promise that resolves with the logo URL string, or null if not set or on error.
 */
export const getLogoUrl = async (): Promise<string | null> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SITE_CONFIG_DOC);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const path = data?.logoPath;
      if (path) {
        return await getDownloadURL(ref(storage, path));
      }
    }
    return null;
  } catch (error: any) {
    // Gracefully fail on permission errors during initial load to not break the app
    if (error?.code === 'storage/object-not-found' || error?.code === 'permission-denied') {
        console.warn("Could not fetch logo, it might not be set yet or rules are pending.", error.code);
        return null;
    }
    console.error("Error fetching logo URL:", error);
    return null;
  }
};

/**
 * Updates the site logo path in Firestore.
 * @param newPath The new Storage path for the logo.
 */
export const updateLogoPath = async (newPath: string): Promise<void> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SITE_CONFIG_DOC);
    // Use setDoc with merge: true to create or update the document without overwriting other fields.
    await setDoc(docRef, { logoPath: newPath }, { merge: true });
  } catch (error) {
    console.error("Error updating logo path:", error);
    throw error;
  }
};
