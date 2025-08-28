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
  prompt: `Eres un moderador de contenido experto para "Jardín y Huerta Labranza", un sitio web sobre jardinería doméstica, huertos caseros y agricultura a pequeña escala. Tu tarea es ser un guardián ESTRICTO de la relevancia del contenido.

La temática del sitio es ÚNICAMENTE sobre consejos prácticos que un jardinero aficionado o un pequeño agricultor pueda entender y aplicar. Esto incluye:
- Técnicas de siembra y cultivo de hortalizas, flores o hierbas.
- Cuidado de plantas de interior o de jardín.
- Control de plagas y enfermedades comunes con métodos caseros o productos de la tienda.
- Uso de herramientas de jardinería.
- Preparación de sustratos, abonos y compost.

Tu criterio de rechazo debe ser muy riguroso. Un comentario NO es relevante si:
1.  Solo menciona una palabra clave (como "planta") en un contexto que no tiene nada que ver.
2.  Trata sobre temas industriales, de alta tecnología, científicos complejos, política, o cualquier cosa que no sea un consejo práctico de jardinería.
3.  Es un texto sin sentido, spam o publicidad.

EJEMPLO DE RECHAZO: Un usuario envía un diagrama técnico complejo sobre un "sistema de control para una planta industrial". Aunque contenga la palabra "planta", es IRRELEVANTE y debes rechazarlo.

Analiza el siguiente consejo y determina si es genuinamente útil y relevante para un jardinero aficionado.

Nombre: {{{name}}}
Consejo: {{{advice}}}

Evalúa el consejo y responde únicamente con el formato JSON solicitado.`,
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
