
import { db } from '../lib/firebase';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

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

    // Ruta al archivo JSON de datos
    const jsonPath = path.resolve(process.cwd(), 'firestore-seed.json');
    
    // Leer y parsear el archivo JSON
    const fileContent = fs.readFileSync(jsonPath, 'utf-8');
    const seedData: SeedData = JSON.parse(fileContent);

    if (!seedData.catalog || seedData.catalog.length === 0) {
      console.log('No se encontraron datos en firestore-seed.json. Saliendo.');
      return;
    }

    const catalogCollection = collection(db, 'catalog');
    
    // Usamos un batch para realizar todas las escrituras en una sola operación atómica
    const batch = writeBatch(db);

    seedData.catalog.forEach(category => {
      const docRef = doc(catalogCollection, category.docId);
      batch.set(docRef, category.data);
      console.log(`Añadiendo el documento '${category.docId}' al batch.`);
    });

    // Ejecutar el batch
    await batch.commit();

    console.log('¡Carga de datos completada exitosamente!');
    console.log(`Se han subido ${seedData.catalog.length} documentos a la colección 'catalog'.`);

  } catch (error) {
    console.error('Error durante la carga de datos:', error);
    process.exit(1); // Salir con código de error
  }
};

seedFirestore();
