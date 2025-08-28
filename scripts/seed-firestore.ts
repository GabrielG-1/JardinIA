
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

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

/**
 * Genera un ID estable y único para un producto.
 * @param categoryId El ID de la categoría.
 * @param productName El nombre del producto.
 * @returns Un identificador único.
 */
const generateStableProductId = (categoryId: string, productName: string): string => {
    const safeName = productName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

    let hash = 0;
    for (let i = 0; i < productName.length; i++) {
        const char = productName.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    const shortHash = Math.abs(hash).toString(36).substring(0, 5);

    return `${categoryId}-${safeName}-${shortHash}`;
}

const seedFirestore = async () => {
  try {
    console.log('Iniciando la carga de datos a Firestore con Admin SDK...');

    // Inicializar Firebase Admin SDK
    if (admin.apps.length === 0) {
        admin.initializeApp();
    }
    const db = admin.firestore();

    const catalogCollection = db.collection('catalog');

    // 1. Borrar todos los documentos existentes en la colección 'catalog'
    console.log('Limpiando la colección "catalog" existente...');
    const existingDocsSnapshot = await catalogCollection.get();
    const deleteBatch = db.batch();
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
    
    console.log('Añadiendo los nuevos documentos con IDs de producto estables...');
    const addBatch = db.batch();

    seedData.catalog.forEach(category => {
      const docRef = catalogCollection.doc(category.docId);
      
      // *** CAMBIO CLAVE: Generar y añadir el ID a cada producto ANTES de subirlo ***
      const productsWithIds = category.data.products.map(product => ({
        ...product,
        id: generateStableProductId(category.docId, product.name),
        inStock: true // Aseguramos que los productos nuevos tengan stock por defecto
      }));

      const categoryDataWithProductIds = {
        ...category.data,
        products: productsWithIds,
      };

      addBatch.set(docRef, categoryDataWithProductIds);
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
