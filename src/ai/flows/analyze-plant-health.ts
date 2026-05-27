
'use server';

/**
 * @fileOverview Analyzes plant health based on a photo and description
 * and recommends product CATEGORIES that can be found in the store.
 *
 * This version is optimized for production:
 * 1. It does NOT load the entire product catalog into the prompt.
 * 2. The AI recommends generic product types (e.g., "fungicide", "tomato seeds").
 * 3. The client is responsible for searching for these product types in the catalog.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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
type AnalyzePlantHealthInput = z.infer<typeof AnalyzePlantHealthInputSchema>;


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
  // AI now returns an array of SEARCH TERMS, not full products.
  recommendedProductKeywords: z.array(z.string()).default([]).describe(
      'Una lista de 1 a 3 términos de búsqueda genéricos y breves para productos relevantes (ej: "fungicida", "semillas de tomate", "fertilizante NPK"). No incluyas nombres de marcas.'
  ),
});
// NOTE: This type is intentionally NOT exported to comply with "use server" constraints.
// The return type of analyzePlantHealth will be inferred automatically.
type AnalyzePlantHealthOutput = z.infer<typeof AnalyzePlantHealthOutputSchema>;


/* -------------------------------- Prompt -------------------------------- */

const analyzePlantHealthPrompt = ai.definePrompt({
  name: 'analyzePlantHealthPrompt_v2',
  model: 'googleai/gemini-2.5-flash',
  output: { schema: AnalyzePlantHealthOutputSchema, format: 'json' },
  config: { temperature: 0.1 },
  prompt: `Eres un experto botánico y agrónomo. Tu objetivo es ayudar a los usuarios a diagnosticar problemas O a obtener consejos de cultivo, recomendando TIPOS de productos genéricos. Tu única tarea es devolver un objeto JSON VÁLIDO que siga el esquema proporcionado.

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

4) Recomienda palabras clave de productos relevantes:
   - Basado en tu análisis, identifica de 1 a 3 tipos de productos genéricos que serían útiles.
   - **MUY IMPORTANTE**: El campo 'recommendedProductKeywords' debe contener ÚNICAMENTE términos de búsqueda simples y genéricos. NO inventes nombres de productos, NO uses marcas.
   - Ejemplos de buenas palabras clave: ["fungicida"], ["semillas de lechuga", "tierra de hojas"], ["fertilizante", "herramientas de jardín"].
   - Si NINGÚN producto es relevante, el campo 'recommendedProductKeywords' DEBE ser un array vacío: [].

5) Revisa tu respuesta final. Debe ser únicamente un objeto JSON válido, sin ningún texto, explicación o nota adicional fuera del JSON.`,
});

/* --------------------------------- Flow --------------------------------- */

const analyzePlantHealthFlow = ai.defineFlow(
  {
    name: 'analyzePlantHealthFlow_v2',
    inputSchema: AnalyzePlantHealthInputSchema,
    outputSchema: AnalyzePlantHealthOutputSchema,
  },
  async (input) => {
    // 1. Llamar a la IA con el input del usuario.
    const { output } = await analyzePlantHealthPrompt(input);

    if (!output) {
        throw new Error('La IA no devolvió una respuesta.');
    }
    
    // 2. La IA devuelve el objeto con las palabras clave, el cliente se encargará de buscar.
    return output;
  }
);

/* ------------------------------- Public API ------------------------------ */

export async function analyzePlantHealth(
  input: AnalyzePlantHealthInput
) {
  return analyzePlantHealthFlow(input);
}
