import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMH8T42vojOtWAuC1MNHiCLds2J9KW0ps",
  authDomain: "jardnia.firebaseapp.com",
  projectId: "jardnia",
  // El storageBucket por defecto se deja aquí, pero lo vamos a sobreescribir abajo.
  storageBucket: "jardnia.appspot.com",
  messagingSenderId: "503843993979",
  appId: "1:503843993979:web:3e217ea66688548147a5de"
};

// --- IMPORTANTE ---
// URL de tu nuevo bucket de Storage en una región con plan gratuito (ej: us-central1)
// Reemplaza el valor de abajo con la URL de tu nuevo bucket, que empieza con "gs://"
const SECONDARY_STORAGE_BUCKET_URL = "gs://PON_AQUI_LA_URL_DE_TU_NUEVO_BUCKET";

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);
// Apuntamos explícitamente al nuevo bucket de Storage
const storage = getStorage(app, SECONDARY_STORAGE_BUCKET_URL);

export { app, db, storage };
