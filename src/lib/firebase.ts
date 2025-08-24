import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMH8T42vojOtWAuC1MNHiCLds2J9KW0ps",
  authDomain: "jardnia.firebaseapp.com",
  projectId: "jardnia",
  storageBucket: "jardnia.appspot.com",
  messagingSenderId: "503843993979",
  appId: "1:503843993979:web:3e217ea66688548147a5de"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);
// Explicitly pass the bucket URL to ensure it points to the desired one
// in the free tier region. The URL comes from the Firebase Console Storage section.
const storage = getStorage(app, "gs://jardnia.firebasestorage.app");
const auth = getAuth(app);


export { app, db, storage, auth };
