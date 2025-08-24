'use server';

/**
 * @fileOverview Analyzes plant health based on a photo and description
 * and recommends products that EXIST in the Firestore catalog.
 *
 * Copy/paste into Firebase/Genkit project. Expects:
 *  - '@/ai/genkit' to export a configured `ai`
 *  - '@/services/catalog-service' to export `searchProducts(query: string): Promise<Product[]>`
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { searchProducts, expandQuery } from '@/services/catalog-service';

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
  price: z.union([z.number(), z.string()]).transform((v) => String(v)),
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
        'Diagnóstico muy breve (2–3 palabras), por ejemplo: "Oídio", "Pulgones", "Deficiencia de nitrógeno".'
      ),
    recommendations: z
      .string()
      .describe(
        'Recomendaciones detalladas. Usa <strong> subtítulos </strong> con <br> al final de cada uno.'
      ),
  }),
  // Siempre presente (array vacío si no hay coincidencias).
  recommendedProducts: z.array(ProductSchema),
});
export type AnalyzePlantHealthOutput = z.infer<typeof AnalyzePlantHealthOutputSchema>;


/* --------------------------------- Tool --------------------------------- */
/** The LLM will call this to find relevant products. */
const productSearchTool = ai.defineTool(
  {
    name: 'productSearch',
    description:
      'Busca en el catálogo productos relevantes (pesticidas, fungicidas, fertilizantes) basándose en un diagnóstico de enfermedad o plaga.',
    inputSchema: z.object({
      query: z.string().describe('El término de búsqueda, por ejemplo: "pulgones", "oidio", "deficiencia de nitrogeno".'),
    }),
    outputSchema: z.array(ProductSchema),
  },
  async (input) => {
    console.log('Buscando productos para el término:', input.query);
    // 1. Expand the query to get more search terms
    const searchTerms = expandQuery(input.query);
    console.log(`Términos de búsqueda expandidos: ${searchTerms.join(', ')}`);

    // 2. Search for products using all the terms
    const results = await searchProducts(searchTerms);
    
    // We limit to 3 results to not overwhelm the user or the context window.
    return results.slice(0, 3);
  }
);

/* -------------------------------- Prompt -------------------------------- */

const analyzePlantHealthPrompt = ai.definePrompt({
  name: 'analyzePlantHealthPrompt',
  model: 'googleai/gemini-1.5-pro-latest',
  tools: [productSearchTool],
  output: { schema: AnalyzePlantHealthOutputSchema, format: 'json' },
  config: { temperature: 0.2 },
  prompt: `Eres un experto botánico y agrónomo. Tu principal objetivo es ayudar al usuario a tener plantas sanas, ofreciendo diagnósticos precisos y recomendaciones honestas. La venta es secundaria. Tu única tarea es devolver un objeto JSON VÁLIDO que siga el esquema proporcionado. Sigue estos pasos:

1) Analiza la entrada:
   - Foto: {{#if photoDataUri}}{{media url=photoDataUri}}{{else}}No proporcionada{{/if}}
   - Descripción: {{{description}}}

2) Completa 'identification' y 'healthDiagnosis'.
   - 'diagnosis' debe ser MUY breve (ej: "Oídio", "Pulgones", "Deficiencia de nitrógeno").
   - 'recommendations' en HTML simple, explicando la causa y solución. Usa subtítulos en <strong> y un <br> tras cada subtítulo.

3) Búsqueda de productos (SOLO si 'isHealthy' = false):
   - Usa la herramienta 'productSearch' UNA SOLA VEZ con tu 'diagnosis' como el 'query'.
   - El campo 'recommendedProducts' en tu respuesta DEBE contener única y exclusivamente la lista de productos que te devuelve la herramienta. NO PUEDES inventar, añadir o modificar productos.
   - Si la herramienta no devuelve productos o si la planta está sana, el campo 'recommendedProducts' debe ser un array vacío: [].

4) Devuelve SOLO el JSON final completo, sin texto adicional.`,
});

/* --------------------------------- Flow --------------------------------- */

const analyzePlantHealthFlow = ai.defineFlow(
  {
    name: 'analyzePlantHealthFlow',
    inputSchema: AnalyzePlantHealthInputSchema,
    outputSchema: AnalyzePlantHealthOutputSchema,
  },
  async (input) => {
    const { output } = await analyzePlantHealthPrompt(input);
    if (!output) throw new Error('La IA no devolvió salida.');

    // Asegura que recommendedProducts exista siempre como un array.
    if (!output.recommendedProducts || !Array.isArray(output.recommendedProducts)) {
      output.recommendedProducts = [];
    }
    
    // Valida y devuelve la salida final.
    return AnalyzePlantHealthOutputSchema.parse(output);
  }
);

/* ------------------------------- Public API ------------------------------ */

export async function analyzePlantHealth(
  input: AnalyzePlantHealthInput
): Promise<AnalyzePlantHealthOutput> {
  return analyzePlantHealthFlow(input);
}
