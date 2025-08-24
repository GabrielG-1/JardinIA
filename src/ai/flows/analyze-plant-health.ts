
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


const AnalyzePlantHealthOutputSchema = z.object({
  identification: z.object({
    isPlant: z.boolean().describe('Indica si la imagen es de una planta o no.'),
    commonName: z.string().describe('El nombre común de la planta identificada.'),
    latinName: z.string().describe('El nombre en latín de la planta identificada.'),
  }),
  healthDiagnosis: z.object({
    isHealthy: z.boolean().describe('Indica si la planta está sana o no.'),
    diagnosis: z.string().describe('El diagnóstico de la salud de la planta.'),
    recommendations: z
      .string()
      .describe(
        'Recomendaciones para el cuidado de la planta. Usa etiquetas <strong> para resaltar los subtítulos, y añade una etiqueta <br> después de cada subtítulo. Por ejemplo: "<strong>Verificar el pH del suelo:</strong><br>El pH ideal para esta planta es..."'
      ),
  }),
});
export type AnalyzePlantHealthOutput = z.infer<typeof AnalyzePlantHealthOutputSchema>;


export async function analyzePlantHealth(input: AnalyzePlantHealthInput): Promise<AnalyzePlantHealthOutput> {
  return analyzePlantHealthFlow(input);
}


const productSearchTool = ai.defineTool(
    {
        name: 'productSearch',
        description: 'Busca en el catálogo de la tienda productos relevantes para el cuidado de las plantas, como pesticidas, fertilizantes, etc.',
        inputSchema: z.object({ query: z.string().describe('Términos de búsqueda para encontrar un producto. Por ejemplo: "hongos", "oidio", "insecticida", "fertilizante rico en nitrógeno".') }),
        outputSchema: z.string().describe('Una cadena de texto con los nombres de los productos más relevantes (máximo 3), separados por comas.'),
    },
    async (input) => {
        console.log(`Buscando productos con el término: ${input.query}`);
        const products = await searchProducts(input.query);
        return products.slice(0, 3).map(p => p.name).join(', ');
    }
);


const analyzePlantHealthPrompt = ai.definePrompt({
  name: 'analyzePlantHealthPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  tools: [productSearchTool],
  input: {schema: AnalyzePlantHealthInputSchema},
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

Pasos a seguir:
1.  **Analiza la Información:** Revisa la imagen y la descripción para identificar la planta y su estado de salud.
2.  **RECOMIENDA PRODUCTOS (Paso Obligatorio si hay un problema):**
    -   Si la planta tiene una enfermedad (hongos, plagas, etc.) o una deficiencia nutricional, **TIENES QUE usar la herramienta 'productSearch'** para encontrar productos que puedan ayudar.
    -   **Piensa en los mejores términos de búsqueda.** Por ejemplo, si diagnosticas 'oidio', busca términos como "oidio" o "control hongos".
    -   Si la herramienta encuentra productos, **DEBES** añadirlos a tus recomendaciones en el JSON. Crea un subtítulo '<strong>Productos Recomendados de la Tienda:</strong><br>' y luego lista los nombres exactos de los productos que te devolvió la herramienta.

3.  **Genera el JSON:** Rellena la estructura JSON solicitada. No añadas comentarios ni texto fuera del JSON.`,
});

const analyzePlantHealthFlow = ai.defineFlow(
  {
    name: 'analyzePlantHealthFlow',
    inputSchema: AnalyzePlantHealthInputSchema,
    outputSchema: AnalyzePlantHealthOutputSchema,
  },
  async (input) => {
    const response = await analyzePlantHealthPrompt(input);
    const output = response.output;

    if (!output) {
      throw new Error("La respuesta de la IA no tenía un formato válido.");
    }
    
    try {
        // La salida ya debería ser un JSON válido gracias a "format: 'json'"
        return AnalyzePlantHealthOutputSchema.parse(output);
    } catch (e) {
        console.error("Error al parsear el JSON de la IA:", e);
        console.error("Respuesta recibida de la IA:", output);
        throw new Error("La respuesta de la IA no tenía un formato JSON válido.");
    }
  }
);
