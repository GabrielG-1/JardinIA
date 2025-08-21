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
    isPlant: z.boolean().describe('Whether or not the input is a plant.'),
    commonName: z.string().describe('The common name of the identified plant.'),
    latinName: z.string().describe('The Latin name of the identified plant.'),
  }),
  healthDiagnosis: z.object({
    isHealthy: z.boolean().describe('Whether or not the plant is healthy.'),
    diagnosis: z.string().describe('The diagnosis of the plant health.'),
    recommendations: z.string().describe('Care recommendations for the plant.'),
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
  prompt: `You are an expert botanist specializing in diagnosing plant health issues and providing care recommendations.

You will analyze the provided information to determine if the plant is healthy, diagnose any issues, and provide care recommendations.

Description: {{{description}}}
Photo: {{media url=photoDataUri}}

Your analysis should include:
*   identification.isPlant: Whether the input is a plant or not (boolean).
*   identification.commonName: The common name of the plant, if identifiable. Otherwise, state that it is not identifiable.
*   identification.latinName: The Latin name of the plant, if identifiable. Otherwise, state that it is not identifiable.
*   healthDiagnosis.isHealthy: Whether the plant appears healthy or not (boolean).
*   healthDiagnosis.diagnosis: A detailed diagnosis of the plant's health, including any identified issues.
*   healthDiagnosis.recommendations: Specific care recommendations to address any identified issues and improve the plant's health.
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
