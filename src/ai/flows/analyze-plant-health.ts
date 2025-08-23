
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
        // Devolvemos solo los nombres de los primeros 3 productos en un string
        return products.slice(0, 3).map(p => p.name).join(', ');
    }
);


const analyzePlantHealthPrompt = ai.definePrompt({
  name: 'analyzePlantHealthPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  tools: [productSearchTool],
  input: {schema: AnalyzePlantHealthInputSchema},
  output: {schema: AnalyzePlantHealthOutputSchema},
  config: {
    temperature: 0.2, 
  },
  prompt: `Eres un experto botánico y agrónomo. Tu tarea es diagnosticar problemas de salud en plantas, ofrecer recomendaciones y, muy importante, recomendar productos de la tienda si es aplicable. Tu respuesta debe ser siempre en español y en un formato JSON válido.

1.  **Analiza la Información:** Revisa la imagen (si se proporciona) y la descripción para identificar la planta y su estado de salud.
    {{#if photoDataUri}}
    Foto: {{media url=photoDataUri}}
    {{/if}}
    Descripción: {{{description}}}

2.  **Completa el Diagnóstico:** Rellena los campos de identificación y diagnóstico de salud.
    -   'isPlant': ¿Es una planta?
    -   'commonName': Nombre común. Si no es identificable, indica "No identificable".
    -   'latinName': Nombre en latín. Si no es identificable, indica "No identificable".
    -   'isHealthy': ¿La planta parece sana?
    -   'diagnosis': Diagnóstico detallado del problema.
    -   'recommendations': Recomendaciones de cuidado. **Importante:** Para los subtítulos dentro de las recomendaciones, envuélvelos en etiquetas '<strong>' y añade una etiqueta '<br>' después de cada uno.

3.  **RECOMIENDA PRODUCTOS (Paso Obligatorio si hay un problema):**
    -   Basándote en tu diagnóstico, si la planta tiene una enfermedad (hongos, plagas, etc.) o una deficiencia nutricional, **TIENES QUE usar la herramienta 'productSearch'** para encontrar productos que puedan ayudar.
    -   **Piensa en los mejores términos de búsqueda.** Por ejemplo, si diagnosticas 'oidio', busca términos como "oidio" o "control hongos". Si ves pulgones, busca "insecticida". Si falta nitrógeno, busca "fertilizante urea".
    -   Si la herramienta encuentra productos, **DEBES** añadirlos a tus recomendaciones. Crea un subtítulo '<strong>Productos Recomendados de la Tienda:</strong><br>' y luego lista los nombres exactos de los productos que te devolvió la herramienta.`,
});

const analyzePlantHealthFlow = ai.defineFlow(
  {
    name: 'analyzePlantHealthFlow',
    inputSchema: AnalyzePlantHealthInputSchema,
    outputSchema: AnalyzePlantHealthOutputSchema,
  },
  async input => {
    const {output} = await analyzePlantHealthPrompt(input);
    return output!;
  }
);
