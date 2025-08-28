import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
  where,
} from "firebase/firestore";
import { type Tip } from "@/types/tip";
import { analyzeTip } from "@/ai/flows/analyze-tip";

const TIPS_COLLECTION = "community-tips";

/**
 * Adds a new community tip to the Firestore collection after AI moderation.
 * @param tip - An object containing the name and advice for the new tip.
 * @returns A boolean indicating if the tip was approved and added.
 */
export const addCommunityTip = async (tip: { name: string; advice: string }): Promise<boolean> => {
  try {
    // 1. Moderate with AI
    const moderationResult = await analyzeTip(tip);
    const isApproved = moderationResult.isRelevant;

    // 2. Add to Firestore
    await addDoc(collection(db, TIPS_COLLECTION), {
      ...tip,
      createdAt: serverTimestamp(),
      isApproved: isApproved,
    });

    return isApproved;
  } catch (error) {
    console.error("Error adding document: ", error);
    // In case of AI error, we can decide to approve by default or reject.
    // For now, let's reject.
    return false;
  }
};

/**
 * Listens for real-time updates to the community tips collection.
 * @param callback - A function to be called with the updated list of tips.
 * @returns An unsubscribe function to detach the listener.
 */
export const getCommunityTips = (callback: (tips: Tip[]) => void): Unsubscribe => {
  const q = query(
    collection(db, TIPS_COLLECTION), 
    where("isApproved", "==", true),
    orderBy("createdAt", "desc")
  );
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const tips: Tip[] = [];
    querySnapshot.forEach((doc) => {
      tips.push({ id: doc.id, ...doc.data() } as Tip);
    });
    callback(tips);
  }, (error) => {
    console.error("Error fetching community tips:", error);
    callback([]);
  });

  return unsubscribe;
};
