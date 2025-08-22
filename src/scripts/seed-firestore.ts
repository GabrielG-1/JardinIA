
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, writeBatch, getDocs, deleteDoc } from 'firebase/firestore';
import *s as fs from 'fs';
import *s as path from 'path';

// Copiamos la configuración de firebase directamente aquí para asegurar la correcta inicialización en el entorno del script
const firebaseConfig = {
  apiKey: "AIzaSyAMH8T42vojOtWAuC1MNHiCLds2J9KW0ps",
  authDomain: "jardnia.firebaseapp.com",
  projectId: "jardnia",
  storageBucket: "jardnia.appspot.com",
  messagingSenderId: "503843993979",
  appId: "1:503843993979:web:3e217ea66688548147a5de"
};

// Define la estructura de los datos en el archivo JSON
interface SeedData {
  catalog: Array<{
    docId: string;
    data: {
      name: string;
      icon: string;
      products: Array<{
        name: string;
        price: string;
        image: string;
        aiHint?: string;
      }>;
    };
  }>;
}

const seedFirestore = async () => {
  try {
    console.log('Iniciando la carga de datos a Firestore...');

    // Inicializar Firebase App y Firestore
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const catalogCollection = collection(db, 'catalog');

    // 1. Borrar todos los documentos existentes en la colección 'catalog'
    console.log('Limpiando la colección "catalog" existente...');
    const existingDocsSnapshot = await getDocs(catalogCollection);
    const deleteBatch = writeBatch(db);
    let deletedCount = 0;
    existingDocsSnapshot.forEach((doc) => {
      deleteBatch.delete(doc.ref);
      deletedCount++;
    });
    
    if (deletedCount > 0) {
        await deleteBatch.commit();
        console.log(`${deletedCount} documentos antiguos han sido eliminados.`);
    } else {
        console.log('La colección ya estaba vacía. No se borró nada.');
    }


    // 2. Cargar los nuevos datos desde el archivo JSON
    const jsonPath = path.resolve(process.cwd(), 'firestore-seed.json');
    
    const fileContent = fs.readFileSync(jsonPath, 'utf-8');
    const seedData: SeedData = JSON.parse(fileContent);

    if (!seedData.catalog || seedData.catalog.length === 0) {
      console.log('No se encontraron datos en firestore-seed.json. Saliendo.');
      process.exit(0);
    }
    
    console.log('Añadiendo los nuevos documentos...');
    const addBatch = writeBatch(db);

    seedData.catalog.forEach(category => {
      const docRef = doc(catalogCollection, category.docId);
      addBatch.set(docRef, category.data);
      console.log(`Añadiendo el documento '${category.docId}' al batch.`);
    });

    await addBatch.commit();

    console.log('¡Carga de datos completada exitosamente!');
    console.log(`Se han subido ${seedData.catalog.length} documentos a la colección 'catalog'.`);
    
    process.exit(0);

  } catch (error) {
    console.error('Error durante la carga de datos:', error);
    process.exit(1);
  }
};

seedFirestore();
