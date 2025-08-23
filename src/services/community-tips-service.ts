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
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { type Tip, type Reply } from "@/types/tip";
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
      replies: [],
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
 * Adds a reply to a specific community tip.
 * @param tipId - The ID of the tip to reply to.
 * @param reply - The reply object.
 */
export const addReplyToTip = async (tipId: string, reply: { name: string; advice: string }) => {
    if (!tipId) {
        console.error("Missing tipId");
        return;
    }
    try {
        const tipRef = doc(db, TIPS_COLLECTION, tipId);
        const replyWithTimestamp: Reply = {
            ...reply,
            createdAt: new Date() as any, // Firestore will convert this to a Timestamp
        };
        await updateDoc(tipRef, {
            replies: arrayUnion(replyWithTimestamp)
        });
    } catch (error) {
        console.error("Error adding reply:", error);
        throw error;
    }
}


/**
 * Listens for real-time updates to the community tips collection.
 * @param callback - A function to be called with the updated list of tips.
 * @returns An unsubscribe function to detach the listener.
 */
export const getCommunityTips = (callback: (tips: Tip[]) => void): Unsubscribe => {
  const q = query(
    collection(db, TIPS_COLLECTION), 
    where("isApproved", "==", true) // Only get approved tips
    // The orderBy clause was removed to avoid needing a composite index.
    // We will sort the results on the client-side.
  );
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const tips: Tip[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Ensure replies is always an array
      if (!data.replies) {
        data.replies = [];
      }
      tips.push({ id: doc.id, ...data } as Tip);
    });

    // Sort tips by creation date, newest first.
    tips.sort((a, b) => {
      const dateA = a.createdAt?.toDate()?.getTime() || 0;
      const dateB = b.createdAt?.toDate()?.getTime() || 0;
      return dateB - dateA;
    });

    callback(tips);
  }, (error) => {
    console.error("Error fetching community tips:", error);
    callback([]);
  });

  return unsubscribe;
};
