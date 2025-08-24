import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// These keys are public and safe to be stored here.
// Security is managed by Firebase Security Rules.
const firebaseConfig = {
  projectId: "jardnia",
  appId: "1:503843993979:web:3e217ea66688548147a5de",
  storageBucket: "jardnia.appspot.com",
  apiKey: "AIzaSyAMH8T42vojOtWAuC1MNHiCLds2J9KW0ps",
  authDomain: "jardnia.firebaseapp.com",
  messagingSenderId: "503843993979",
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);
// Use the storageBucket from the config to initialize storage
const storage = getStorage(app);
const auth = getAuth(app);


export { app, db, storage, auth };
