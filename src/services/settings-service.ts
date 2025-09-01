
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

const SETTINGS_COLLECTION = "settings";
const SITE_CONFIG_DOC = "siteConfig"; // A single document for all site-wide settings

/**
 * Retrieves the URL of the site logo from Firestore.
 * @returns A promise that resolves with the logo URL string, or null if not set.
 */
export const getLogoUrl = async (): Promise<string | null> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SITE_CONFIG_DOC);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data()?.logoUrl || null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching logo URL:", error);
    return null;
  }
};

/**
 * Updates the site logo URL in Firestore.
 * @param newUrl The new URL for the logo.
 */
export const updateLogoUrl = async (newUrl: string): Promise<void> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SITE_CONFIG_DOC);
    // Use setDoc with merge: true to create or update the document without overwriting other fields.
    await setDoc(docRef, { logoUrl: newUrl }, { merge: true });
  } catch (error) {
    console.error("Error updating logo URL:", error);
    throw error;
  }
};

    
