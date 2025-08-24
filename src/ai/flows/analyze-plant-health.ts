
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
    diagnosis: z.string().describe('Un diagnóstico muy breve (2-3 palabras) de la salud de la planta. Por ejemplo: "Oídio" o "Deficiencia de nitrógeno".'),
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
        description: 'Busca en el catálogo de la tienda productos relevantes para el cuidado de las plantas, como pesticidas, fertilizantes, etc.',
        inputSchema: z.object({ query: z.string().describe('Términos de búsqueda para encontrar un producto. Por ejemplo: "hongos", "oidio", "insecticida", "pulgones", "fertilizante rico en nitrógeno".') }),
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
  prompt: `Eres un experto botánico y agrónomo. Tu única tarea es devolver un objeto JSON válido basado en la información proporcionada.

Información de entrada:
{{#if photoDataUri}}
Foto: {{media url=photoDataUri}}
{{/if}}
Descripción: {{{description}}}

Pasos a seguir en este orden estricto:
1.  **Analiza la Información:** Revisa la imagen y la descripción para identificar la planta y su estado de salud.
2.  **Rellena los campos 'identification' y 'healthDiagnosis'** con tu análisis. Para 'recommendations', proporciona una explicación amigable y útil sobre el problema y cómo solucionarlo, usando subtítulos como "<strong>Posible diagnóstico:</strong><br>", "<strong>Síntomas:</strong><br>", y "<strong>Tratamiento:</strong><br>".
3.  **BUSCA PRODUCTOS (Si hay un problema):** Si la planta tiene una enfermedad, plaga o deficiencia, **DEBES usar la herramienta 'productSearch' UNA SOLA VEZ** para encontrar productos relevantes. **Piensa en los mejores términos de búsqueda basados en TU diagnóstico.** Por ejemplo, si diagnosticas 'Pulgones', busca "insecticida pulgones". Si diagnosticas 'Oídio', busca "control hongos".
4.  **AÑADE PRODUCTOS AL JSON:** Toma el array de objetos de producto que te devolvió la herramienta **y colócalo directamente en el campo 'recommendedProducts' del JSON.** No modifiques los datos. Si la herramienta no devuelve nada o si la planta está sana, deja el campo 'recommendedProducts' como un array vacío [].
5.  **Genera el JSON final:** Devuelve el objeto JSON completo. No añadas comentarios ni texto fuera del JSON. No llames a la herramienta más de una vez.`,
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
        return AnalyzePlantHealthOutputSchema.parse(output);
    } catch (e) {
        console.error("Error al parsear el JSON de la IA:", e);
        console.error("Respuesta recibida de la IA:", JSON.stringify(output, null, 2));
        throw new Error("La respuesta de la IA no tenía un formato JSON válido.");
    }
  }
);
