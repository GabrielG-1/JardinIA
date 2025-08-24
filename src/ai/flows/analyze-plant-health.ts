
'use server';

/**
 * @fileOverview Analyzes plant health based on a photo and description.
 *
 * - analyzePlantHealth - A function that analyzes plant health and returns a diagnosis.
 * - AnalyzePlantHealthInput - The input type for the analyzePlantHealth function.
 * - AnalyzePlantHealthOutput - The return type for the analyzePlantHealth function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { searchProducts, type Product } from '@/services/catalog-service';

const AnalyzePlantHealthInputSchema = z.object({
  photoDataUri: z
    .string()
    .optional()
    .describe(
      'A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
  description: z.string().describe('The description of the plant.'),
});
export type AnalyzePlantHealthInput = z.infer<typeof AnalyzePlantHealthInputSchema>;

const ProductSchema = z.object({
    name: z.string(),
    price: z.string(),
    image: z.string().url().or(z.literal("")),
    aiHint: z.string().optional(),
});

const AnalyzePlantHealthOutputSchema = z.object({
  identification: z.object({
    isPlant: z.boolean().describe('Indica si la imagen es de una planta o no.'),
    commonName: z.string().describe('El nombre común de la planta identificada.'),
    latinName: z.string().describe('El nombre en latín de la planta identificada.'),
  }),
  healthDiagnosis: z.object({
    isHealthy: z.boolean().describe('Indica si la planta está sana o no.'),
    diagnosis: z.string().describe('Un diagnóstico muy breve (2-3 palabras) de la salud de la planta. Por ejemplo: "Oídio" o "Pulgones".'),
    recommendations: z
      .string()
      .describe(
        'Recomendaciones detalladas para el cuidado de la planta. Usa etiquetas <strong> para resaltar los subtítulos (como "Posible diagnóstico:", "Síntomas:", "Tratamiento:"), y añade una etiqueta <br> después de cada subtítulo.'
      ),
  }),
  recommendedProducts: z.array(ProductSchema).optional().describe('Una lista de productos relevantes de la tienda para tratar el problema. Se obtiene usando la herramienta productSearch.'),
});
export type AnalyzePlantHealthOutput = z.infer<typeof AnalyzePlantHealthOutputSchema>;


export async function analyzePlantHealth(input: AnalyzePlantHealthInput): Promise<AnalyzePlantHealthOutput> {
  return analyzePlantHealthFlow(input);
}


const productSearchTool = ai.defineTool(
    {
        name: 'productSearch',
        description: 'Busca en el catálogo de la tienda productos relevantes para el cuidado de las plantas, como pesticidas, fertilizantes, etc., basándose en un término de búsqueda.',
        inputSchema: z.object({ query: z.string().describe('El término de búsqueda para encontrar productos, basado en el diagnóstico. Por ejemplo: "hongos", "oidio", "insecticida", "pulgones", "fertilizante", "deficiencia de nitrógeno".') }),
        outputSchema: z.array(ProductSchema),
    },
    async (input) => {
        console.log(`Buscando productos con el término: ${input.query}`);
        const products = await searchProducts(input.query);
        // Devuelve hasta 3 productos que coincidan.
        return products.slice(0, 3);
    }
);


const analyzePlantHealthPrompt = ai.definePrompt({
  name: 'analyzePlantHealthPrompt',
  model: 'googleai/gemini-1.5-pro-latest',
  tools: [productSearchTool],
  output: {
    schema: AnalyzePlantHealthOutputSchema,
    format: 'json'
  },
  config: {
    temperature: 0.2, 
  },
  prompt: `Eres un experto botánico y agrónomo. Tu única tarea es devolver un objeto JSON válido que siga el esquema proporcionado. Sigue estos pasos en orden estricto:

1.  **Analiza la Entrada:** Revisa la foto y la descripción para identificar la planta y su estado.
    - Foto: {{#if photoDataUri}}{{media url=photoDataUri}}{{else}}No proporcionada{{/if}}
    - Descripción: {{{description}}}

2.  **Rellena los Campos del Diagnóstico:** Completa los campos 'identification' y 'healthDiagnosis' con tu análisis profesional.
    - Para 'diagnosis', sé muy breve y directo (ej: "Pulgones", "Oídio", "Deficiencia de nitrógeno").
    - Para 'recommendations', da una explicación detallada y amigable sobre cómo solucionar el problema, usando subtítulos como "<strong>Posible diagnóstico:</strong><br>", "<strong>Síntomas:</strong><br>", y "<strong>Tratamiento:</strong><br>".

3.  **Busca Productos (SI ES NECESARIO):**
    - **Si la planta está enferma o tiene una plaga (si 'isHealthy' es 'false')**, DEBES usar la herramienta 'productSearch'.
    - **Usa el valor EXACTO que pusiste en el campo 'diagnosis' como el 'query' para la búsqueda.** Por ejemplo, si tu diagnóstico fue "Oídio", el query de búsqueda debe ser "Oídio".
    - Llama a la herramienta UNA SOLA VEZ.

4.  **Completa el JSON:**
    - Toma el array de productos que te devolvió la herramienta y colócalo directamente en el campo 'recommendedProducts' del JSON.
    - Si la planta está sana o la herramienta no devolvió productos, deja 'recommendedProducts' como un array vacío [].
    - Devuelve el objeto JSON completo y nada más. No añadas comentarios ni texto fuera del JSON. Tu trabajo termina después de generar el JSON.`,
});

const analyzePlantHealthFlow = ai.defineFlow(
  {
    name: 'analyzePlantHealthFlow',
    inputSchema: AnalyzePlantHealthInputSchema,
    outputSchema: AnalyzePlantHealthOutputSchema,
  },
  async (input) => {
    const {output} = await analyzePlantHealthPrompt(input);

    if (!output) {
      throw new Error("La respuesta de la IA no tenía un formato válido.");
    }
    
    try {
        // Validar explícitamente la salida con Zod antes de devolverla.
        return AnalyzePlantHealthOutputSchema.parse(output);
    } catch (e) {
        console.error("Error al parsear el JSON de la IA:", e);
        console.error("Respuesta recibida de la IA:", JSON.stringify(output, null, 2));
        throw new Error("La respuesta de la IA no tenía un formato JSON válido.");
    }
  }
);
