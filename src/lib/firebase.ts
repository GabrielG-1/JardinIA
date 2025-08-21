import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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
const storage = getStorage(app);

export { app, db, storage };
