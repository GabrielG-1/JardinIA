'use server';
/**
 * @fileOverview An AI agent to moderate community tips.
 *
 * - analyzeTip - A function that checks if a tip is related to the website's theme.
 * - AnalyzeTipInput - The input type for the analyzeTip function.
 * - AnalyzeTipOutput - The return type for the analyzeTip function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeTipInputSchema = z.object({
  name: z.string().describe('The name of the person submitting the tip.'),
  advice: z.string().describe('The content of the tip or comment.'),
});
export type AnalyzeTipInput = z.infer<typeof AnalyzeTipInputSchema>;

const AnalyzeTipOutputSchema = z.object({
  isRelevant: z
    .boolean()
    .describe(
      'Indica si el consejo está relacionado con jardinería, agricultura, plantas, cultivos o temas afines. Debe ser estrictamente sobre la temática.'
    ),
});
export type AnalyzeTipOutput = z.infer<typeof AnalyzeTipOutputSchema>;

export async function analyzeTip(input: AnalyzeTipInput): Promise<AnalyzeTipOutput> {
  return analyzeTipFlow(input);
}

const analyzeTipPrompt = ai.definePrompt({
  name: 'analyzeTipPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: AnalyzeTipInputSchema},
  output: {schema: AnalyzeTipOutputSchema},
  config: {
    temperature: 0.0,
  },
  prompt: `Eres un moderador de contenido para un sitio web de jardinería y agricultura llamado "Jardín y Huerta Labranza". Tu única tarea es determinar si el siguiente consejo o comentario es relevante para la temática del sitio.

La temática incluye: plantas, jardinería, agricultura, cultivos, herramientas de jardín, semillas, fertilizantes, pesticidas, problemas de plantas, etc.

El comentario NO es relevante si habla de otros temas como política, deportes, tecnología no relacionada, etc. Sé muy estricto.

Nombre: {{{name}}}
Consejo: {{{advice}}}

Evalúa el consejo y determina si es relevante. Responde únicamente con el formato JSON solicitado.`,
});

const analyzeTipFlow = ai.defineFlow(
  {
    name: 'analyzeTipFlow',
    inputSchema: AnalyzeTipInputSchema,
    outputSchema: AnalyzeTipOutputSchema,
  },
  async input => {
    const {output} = await analyzeTipPrompt(input);
    return output!;
  }
);
