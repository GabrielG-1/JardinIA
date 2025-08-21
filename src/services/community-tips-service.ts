import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { type Tip } from "@/types/tip";

const TIPS_COLLECTION = "community-tips";

/**
 * Adds a new community tip to the Firestore collection.
 * @param tip - An object containing the name and advice for the new tip.
 */
export const addCommunityTip = async (tip: { name: string; advice: string }) => {
  try {
    await addDoc(collection(db, TIPS_COLLECTION), {
      ...tip,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding document: ", error);
  }
};

/**
 * Listens for real-time updates to the community tips collection.
 * @param callback - A function to be called with the updated list of tips.
 * @returns An unsubscribe function to detach the listener.
 */
export const getCommunityTips = (callback: (tips: Tip[]) => void): Unsubscribe => {
  const q = query(collection(db, TIPS_COLLECTION), orderBy("createdAt", "desc"));
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const tips: Tip[] = [];
    querySnapshot.forEach((doc) => {
      tips.push({ id: doc.id, ...doc.data() } as Tip);
    });
    callback(tips);
  });

  return unsubscribe;
};
