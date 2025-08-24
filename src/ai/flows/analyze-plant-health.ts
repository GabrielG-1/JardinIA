
'use server';

/**
 * @fileOverview Analyzes plant health based on a photo and description
 * and recommends products that EXIST in the Firestore catalog.
 *
 * Copy/paste into Firebase/Genkit project. Expects:
 *  - '@/ai/genkit' to export a configured `ai`
 *  - '@/services/catalog-service' to export `getAllProducts(): Promise<CatalogProduct[]>`
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getAllProducts } from '@/services/catalog-service';

/* ----------------------------- Input schema ----------------------------- */

const AnalyzePlantHealthInputSchema = z.object({
  photoDataUri: z
    .string()
    .optional()
    .describe(
      "A photo of a plant, as a data URI. Format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().describe('The description of the plant.'),
});
export type AnalyzePlantHealthInput = z.infer<typeof AnalyzePlantHealthInputSchema>;

/* ---------------------------- Product schema ---------------------------- */
/** Tolerant schema that normalizes price to string and image to optional. */
const ProductSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  price: z.string().describe('El precio del producto como una cadena de texto.'),
  image: z.string().optional().default(''),
  aiHint: z.string().optional(),
});
export type CatalogProduct = z.infer<typeof ProductSchema>;

/* ----------------------------- Output schema ---------------------------- */

const AnalyzePlantHealthOutputSchema = z.object({
  identification: z.object({
    isPlant: z.boolean().describe('Indica si la imagen es de una planta o no.'),
    commonName: z.string().describe('El nombre común de la planta identificada.'),
    latinName: z.string().default('').describe('El nombre en latín de la planta identificada.'),
  }),
  healthDiagnosis: z.object({
    isHealthy: z.boolean().describe('Indica si la planta está sana o no.'),
    diagnosis: z
      .string()
      .describe(
        'Diagnóstico muy breve (2–3 palabras), por ejemplo: "Oídio", "Pulgones", "Deficiencia de nitrógeno". Si el usuario solo pide consejos, usa "Consejos de cultivo".'
      ),
    recommendations: z
      .string()
      .describe(
        'Recomendaciones detalladas. Usa <strong> subtítulos </strong> con <br> al final de cada uno.'
      ),
  }),
  // Siempre presente (array vacío si no hay coincidencias).
  recommendedProducts: z.array(ProductSchema).default([]),
});
export type AnalyzePlantHealthOutput = z.infer<typeof AnalyzePlantHealthOutputSchema>;


/* -------------------------------- Prompt -------------------------------- */

const analyzePlantHealthPrompt = ai.definePrompt({
  name: 'analyzePlantHealthPrompt',
  model: 'googleai/gemini-1.5-pro-latest',
  output: { schema: AnalyzePlantHealthOutputSchema, format: 'json' },
  config: { temperature: 0.1 },
  prompt: `Eres un experto botánico y agrónomo. Tu objetivo es ayudar a los usuarios a diagnosticar problemas O a obtener consejos de cultivo, recomendando soluciones y productos REALES de nuestro catálogo. Tu única tarea es devolver un objeto JSON VÁLIDO que siga el esquema proporcionado.

Este es el catálogo completo de productos disponibles en la tienda. Úsalo como tu única fuente de verdad para las recomendaciones:
--- INICIO DEL CATÁLOGO ---
{{{catalog}}}
--- FIN DEL CATÁLOGO ---

Sigue estos pasos estrictamente:

1) Analiza la entrada del usuario:
   - Foto: {{#if photoDataUri}}{{media url=photoDataUri}}{{else}}No proporcionada{{/if}}
   - Descripción: {{{description}}}

2) Determina la intención del usuario. Hay dos posibilidades:
   a) **Diagnóstico de problemas:** El usuario describe síntomas de una planta enferma.
   b) **Consejos de cultivo:** El usuario pregunta cómo plantar algo, qué necesita para empezar, o pide consejos generales.

3) Completa los campos 'identification' y 'healthDiagnosis' según la intención:
   - Para **Diagnóstico**:
     - 'diagnosis' debe ser breve y directo (ej: "Oídio", "Pulgones").
     - 'recommendations' debe explicar la causa y la solución.
     - 'isHealthy' debe ser 'false'.
   - Para **Consejos de cultivo**:
     - 'diagnosis' debe ser "Consejos de cultivo".
     - 'recommendations' debe ser una guía clara y útil sobre cómo realizar la tarea solicitada (ej: cómo sembrar lechugas).
     - 'isHealthy' debe ser 'true'.

4) Recomienda productos relevantes del catálogo:
   - **Para Diagnóstico:** Si 'isHealthy' es 'false', selecciona 1-3 productos que solucionen el problema (ej: fungicidas, insecticidas, etc.).
   - **Para Consejos de cultivo:** Incluso si 'isHealthy' es 'true', analiza la descripción del usuario. Si pide plantar algo, recomienda las semillas correspondientes, tierra, fertilizantes iniciales o herramientas.
   - El campo 'recommendedProducts' de tu respuesta DEBE contener ÚNICA Y EXCLUSIVAMENTE los productos que has seleccionado de la lista. NO PUEDES inventar, añadir, modificar o alucinar ningún producto. Los datos deben ser idénticos a los del catálogo.
   - Si NINGÚN producto del catálogo es adecuado, el campo 'recommendedProducts' DEBE ser un array vacío: [].

5) Revisa tu respuesta final. Debe ser únicamente un objeto JSON válido, sin ningún texto, explicación o nota adicional fuera del JSON.`,
});

/* --------------------------------- Flow --------------------------------- */

const analyzePlantHealthFlow = ai.defineFlow(
  {
    name: 'analyzePlantHealthFlow',
    inputSchema: AnalyzePlantHealthInputSchema,
    outputSchema: AnalyzePlantHealthOutputSchema,
  },
  async (input) => {
    // 1. Cargar el catálogo completo de productos.
    const allProducts = await getAllProducts();
    const catalogString = allProducts.map(p => `- ${p.name} (Precio: ${p.price})`).join('\n');
    
    // 2. Llamar a la IA con el input del usuario y el catálogo inyectado en el prompt.
    const { output } = await analyzePlantHealthPrompt({
      ...input,
      catalog: catalogString,
    });

    if (!output) {
        throw new Error('La IA no devolvió una respuesta.');
    }
    
    // 3. Limpieza y validación final.
    // Aunque el prompt es estricto, nos aseguramos que el output cumple el esquema.
    const finalOutput: AnalyzePlantHealthOutput = {
      identification: {
        isPlant: output.identification?.isPlant ?? false,
        commonName: output.identification?.commonName ?? 'No identificado',
        latinName: output.identification?.latinName ?? '',
      },
      healthDiagnosis: {
        isHealthy: output.healthDiagnosis?.isHealthy ?? true,
        diagnosis: output.healthDiagnosis?.diagnosis ?? 'No se pudo determinar',
        recommendations: output.healthDiagnosis?.recommendations ?? 'No hay recomendaciones.',
      },
      recommendedProducts: [], // Empezamos con un array vacío
    };

    // Si la IA recomendó productos, los buscamos en nuestro catálogo original 
    // para asegurarnos de que son 100% reales y tienen todos los datos correctos (imagen, id, etc.).
    if (output.recommendedProducts && output.recommendedProducts.length > 0) {
        const productNamesFromAI = new Set(output.recommendedProducts.map(p => p.name));
        const verifiedProducts = allProducts.filter(p => productNamesFromAI.has(p.name));
        finalOutput.recommendedProducts = verifiedProducts.slice(0, 3);
    }
    
    return AnalyzePlantHealthOutputSchema.parse(finalOutput);
  }
);

/* ------------------------------- Public API ------------------------------ */

export async function analyzePlantHealth(
  input: AnalyzePlantHealthInput
): Promise<AnalyzePlantHealthOutput> {
  return analyzePlantHealthFlow(input);
}
