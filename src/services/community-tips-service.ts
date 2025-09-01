import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  where,
  doc,
  updateDoc,
  arrayUnion,
  Timestamp,
  deleteDoc,
  getDoc,
  arrayRemove,
  getDocs,
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
      replies: [], // Initialize with an empty array for replies
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
 * Fetches approved community tips once from the Firestore collection.
 * This is not a real-time listener.
 * @returns A promise that resolves to an array of approved tips.
 */
export const getCommunityTips = async (): Promise<Tip[]> => {
  try {
    const q = query(
      collection(db, TIPS_COLLECTION),
      where("isApproved", "==", true),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const tips: Tip[] = [];
    querySnapshot.forEach((doc) => {
      tips.push({ id: doc.id, ...doc.data() } as Tip);
    });
    return tips;

  } catch (error) {
    console.error("Error fetching community tips:", error);
    // Return an empty array in case of error.
    return [];
  }
};


/**
 * Adds a reply to a specific community tip.
 * @param tipId The ID of the tip to reply to.
 * @param replyData The reply object containing name and text.
 * @returns A promise that resolves when the reply is added.
 */
export const addReplyToTip = async (tipId: string, replyData: { name: string; text: string }) => {
    try {
        const tipRef = doc(db, TIPS_COLLECTION, tipId);
        
        const newReply: Reply = {
            id: doc(collection(db, 'dummy')).id, // Generate a unique ID for the reply
            name: replyData.name,
            text: replyData.text,
            createdAt: Timestamp.now(), 
        };

        await updateDoc(tipRef, {
            replies: arrayUnion(newReply)
        });
        
    } catch (error) {
        console.error("Error adding reply:", error);
        throw error;
    }
};

/**
 * Deletes a specific reply from a community tip.
 * @param tipId The ID of the tip containing the reply.
 * @param reply The entire reply object to be deleted.
 */
export const deleteReplyFromTip = async (tipId: string, reply: Reply): Promise<void> => {
  try {
    const tipRef = doc(db, TIPS_COLLECTION, tipId);
    await updateDoc(tipRef, {
      replies: arrayRemove(reply),
    });
  } catch (error) {
    console.error("Error deleting reply:", error);
    throw error;
  }
};
