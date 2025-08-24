
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { collection, getDocs, doc, getDoc, writeBatch } from 'firebase/firestore';


// La configuración del proyecto se obtiene de las variables de entorno de Firebase.
// No es necesario definirla aquí cuando se usa el Admin SDK en un entorno de Firebase.
// Si corres este script localmente fuera de Firebase, necesitarás configurar las credenciales de la cuenta de servicio.

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
    console.log('Iniciando la carga de datos a Firestore con Admin SDK...');

    // Inicializar Firebase Admin SDK
    // El SDK buscará automáticamente las credenciales en el entorno.
    if (admin.apps.length === 0) {
        admin.initializeApp();
    }
    const db = admin.firestore();

    const catalogCollection = admin.firestore().collection('catalog');

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
      const docRef = catalogCollection.doc(category.docId);
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
