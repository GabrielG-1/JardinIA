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
      'Indica si el consejo está relacionado con jardinería, agricultura, plantas, o con una opinión sobre la tienda. Debe ser estrictamente sobre la temática.'
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
  prompt: `Eres un moderador de contenido experto para "Jardín y Huerta Labranza", un sitio web sobre jardinería y una tienda de productos agrícolas. Tu tarea es ser un guardián ESTRICTO de la relevancia del contenido.

Un comentario es RELEVANTE si pertenece a una de estas dos categorías:
1.  **Consejos de Jardinería:** Consejos prácticos que un jardinero aficionado o un pequeño agricultor pueda entender y aplicar (siembra, cuidado de plantas, control de plagas, herramientas, abonos, etc.).
2.  **Opiniones sobre la Tienda:** Comentarios sobre la experiencia del cliente en la tienda física "Jardín y Huerta Labranza". Esto incluye la calidad de la atención, la variedad de productos, los precios o la amabilidad del personal.

Tu criterio de rechazo debe ser muy riguroso. Un comentario NO es relevante si:
- Solo menciona una palabra clave (como "planta") en un contexto que no tiene nada que ver.
- Trata sobre temas industriales, de alta tecnología, científicos complejos, política, o cualquier cosa que no sea un consejo práctico de jardinería o una opinión sobre la tienda.
- Es un texto sin sentido, spam o publicidad no solicitada.

EJEMPLO DE RECHAZO: Un usuario envía un diagrama técnico complejo sobre un "sistema de control para una planta industrial". Aunque contenga la palabra "planta", es IRRELEVANTE y debes rechazarlo.
EJEMPLO DE ACEPTACIÓN 1: "Mi truco para los pulgones es rociar con agua jabonosa". -> Es un consejo de jardinería. ACEPTAR.
EJEMPLO DE ACEPTACIÓN 2: "Fui a la tienda y la atención fue excelente, ¡el dueño sabe mucho!". -> Es una opinión sobre la tienda. ACEPTAR.

Analiza el siguiente comentario y determina si es genuinamente útil y relevante para la comunidad.

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
