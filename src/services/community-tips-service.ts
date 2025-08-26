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
  deleteDoc,
  arrayRemove,
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
        // The reply object now includes a client-side generated timestamp
        const replyToAdd = {
            ...reply,
            createdAt: new Date(),
        };

        await updateDoc(tipRef, {
            replies: arrayUnion(replyToAdd)
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
    where("isApproved", "==", true),
    orderBy("createdAt", "desc")
  );
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const tips: Tip[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Ensure replies is always an array and sort them by date
      if (!data.replies) {
        data.replies = [];
      } else {
        // Sort replies by createdAt date, oldest first
        data.replies.sort((a: Reply, b: Reply) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
            return dateA - dateB;
        });
      }
      tips.push({ id: doc.id, ...data } as Tip);
    });

    callback(tips);
  }, (error) => {
    console.error("Error fetching community tips:", error);
    callback([]);
  });

  return unsubscribe;
};

/**
 * Deletes a specific reply from a community tip. This is a client-side operation.
 * @param tipId The ID of the tip containing the reply.
 * @param replyToDelete The full reply object to remove.
 */
export const deleteReplyFromTip = async (tipId: string, replyToDelete: Reply) => {
    try {
        const tipRef = doc(db, TIPS_COLLECTION, tipId);
        // Important: To remove an object from an array, you must provide an object
        // with the exact same field values. We convert the client-side date back to
        // the format that Firestore expects for the comparison.
        await updateDoc(tipRef, {
            replies: arrayRemove(replyToDelete)
        });
    } catch (error) {
        console.error("Error deleting reply:", error);
        throw error;
    }
};
