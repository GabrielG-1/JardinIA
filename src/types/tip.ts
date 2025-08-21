import { type Timestamp } from "firebase/firestore";

export type Tip = {
  id: string;
  name: string;
  advice: string;
  createdAt: Timestamp;
};
