import { type Timestamp } from "firebase/firestore";

export type Reply = {
  name: string;
  advice: string;
  createdAt: Timestamp;
};

export type Tip = {
  id: string;
  name: string;
  advice: string;
  createdAt: Timestamp;
  isApproved: boolean;
  replies?: Reply[];
};