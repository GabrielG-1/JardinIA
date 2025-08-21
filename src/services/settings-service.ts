import { db } from "@/lib/firebase";
import {
  doc,
  onSnapshot,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";

const SETTINGS_COLLECTION = "settings";
const HERO_DOC_ID = "hero";

export type HeroSettings = {
  imageUrl: string;
};

/**
 * Listens for real-time updates to the hero settings.
 * @param callback - A function to be called with the updated hero settings.
 * @returns An unsubscribe function to detach the listener.
 */
export const getHeroSettings = (callback: (settings: HeroSettings | null) => void): Unsubscribe => {
  const docRef = doc(db, SETTINGS_COLLECTION, HERO_DOC_ID);

  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as HeroSettings);
    } else {
      // Document doesn't exist
      callback(null);
    }
  }, (error) => {
    console.error("Error fetching hero settings: ", error);
    callback(null);
  });

  return unsubscribe;
};

/**
 * Updates the hero image URL in Firestore.
 * @param imageUrl - The new download URL for the hero background image.
 */
export const updateHeroImage = async (imageUrl: string) => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, HERO_DOC_ID);
    await setDoc(docRef, { imageUrl }, { merge: true });
  } catch (error) {
    console.error("Error updating hero image: ", error);
    throw error;
  }
};
