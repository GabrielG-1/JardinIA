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

const AnalyzePlantHealthInputSchema = z.object({
  photoDataUri: z
    .string()
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

const analyzePlantHealthPrompt = ai.definePrompt({
  name: 'analyzePlantHealthPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: AnalyzePlantHealthInputSchema},
  output: {schema: AnalyzePlantHealthOutputSchema},
  config: {
    temperature: 0.2, // Lower temperature for more deterministic and consistent responses
  },
  prompt: `Eres un experto botánico especializado en diagnosticar problemas de salud de las plantas y en ofrecer recomendaciones de cuidado. Tu respuesta debe ser siempre en español y en un formato JSON válido que se ajuste al esquema de salida.

Analizarás la información proporcionada para determinar si la planta está sana, diagnosticar cualquier problema y proporcionar recomendaciones de cuidado.

Descripción: {{{description}}}
Foto: {{media url=photoDataUri}}

Analiza la imagen y la descripción para rellenar los siguientes campos:
- identification.isPlant: ¿Es la imagen de una planta? (true/false)
- identification.commonName: Nombre común de la planta. Si no es identificable, indica "No identificable".
- identification.latinName: Nombre en latín de la planta. Si no es identificable, indica "No identificable".
- healthDiagnosis.isHealthy: ¿La planta parece sana? (true/false)
- healthDiagnosis.diagnosis: Diagnóstico detallado de la salud, incluyendo problemas.
- healthDiagnosis.recommendations: Recomendaciones de cuidado. Para los subtítulos dentro de las recomendaciones, envuélvelos en etiquetas <strong> y añade una etiqueta <br> después de cada subtítulo. Por ejemplo: "<strong>Verificar el pH del suelo:</strong><br>El pH ideal para esta planta es...".
`,
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
