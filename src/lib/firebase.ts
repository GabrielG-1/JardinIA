import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app;
if (!getApps().length) {
  try {
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "PEGAR_AQUÍ_LA_API_KEY_DE_LA_CONSOLA") {
      throw new Error("Missing or placeholder Firebase API Key. Please check your .env file.");
    }
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error("Error initializing Firebase. Check your firebaseConfig object and .env file.", error);
  }
} else {
  app = getApp();
}

const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
