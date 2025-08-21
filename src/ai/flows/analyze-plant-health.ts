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
        'Recomendaciones para el cuidado de la planta. Usa etiquetas HTML <strong> para resaltar los subtítulos, por ejemplo: "<strong>Verificar el pH del suelo:</strong> El pH ideal para esta planta es..."'
      ),
  }),
});
export type AnalyzePlantHealthOutput = z.infer<typeof AnalyzePlantHealthOutputSchema>;

export async function analyzePlantHealth(input: AnalyzePlantHealthInput): Promise<AnalyzePlantHealthOutput> {
  return analyzePlantHealthFlow(input);
}

const analyzePlantHealthPrompt = ai.definePrompt({
  name: 'analyzePlantHealthPrompt',
  input: {schema: AnalyzePlantHealthInputSchema},
  output: {schema: AnalyzePlantHealthOutputSchema},
  prompt: `Eres un experto botánico especializado en diagnosticar problemas de salud de las plantas y en ofrecer recomendaciones de cuidado. Tu respuesta debe ser siempre en español.

Analizarás la información proporcionada para determinar si la planta está sana, diagnosticar cualquier problema y proporcionar recomendaciones de cuidado.

Descripción: {{{description}}}
Foto: {{media url=photoDataUri}}

Tu análisis debe incluir:
*   identification.isPlant: Si la imagen es una planta o no (booleano).
*   identification.commonName: El nombre común de la planta, si es identificable. En caso contrario, indica que no es identificable.
*   identification.latinName: El nombre en latín de la planta, si es identificable. En caso contrario, indica que no es identificable.
*   healthDiagnosis.isHealthy: Si la planta parece sana o no (booleano).
*   healthDiagnosis.diagnosis: Un diagnóstico detallado de la salud de la planta, incluyendo cualquier problema identificado.
*   healthDiagnosis.recommendations: Recomendaciones de cuidado específicas para solucionar cualquier problema identificado y mejorar la salud de la planta. Para los subtítulos dentro de las recomendaciones, envuélvelos en etiquetas <strong>. Por ejemplo: "<strong>Verificar el pH del suelo:</strong> El pH ideal para esta planta es...".
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
