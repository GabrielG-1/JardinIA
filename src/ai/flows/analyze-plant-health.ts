'use server';

/**
 * @fileOverview Analyzes plant health based on a photo and description
 * and recommends products that EXIST in the Firestore catalog.
 *
 * Copy/paste into Firebase/Genkit project. Expects:
 *  - '@/ai/genkit' to export a configured `ai`
 *  - '@/services/catalog-service' to export `searchProducts(query: string): Promise<Product[]>`
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { searchProducts } from '@/services/catalog-service';

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
export type AnalyzePlantHealthInput = z.infer<typeof AnalyzePlantHealthInputSchema>;

/* ---------------------------- Product schema ---------------------------- */
/** Tolerant schema that normalizes price to string and image to optional. */
const ProductSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  price: z.union([z.number(), z.string()]).transform((v) => String(v)),
  image: z.string().optional().default(''),
  aiHint: z.string().optional(),
});
export type CatalogProduct = z.infer<typeof ProductSchema>;

/* ----------------------------- Output schema ---------------------------- */

const AnalyzePlantHealthOutputSchema = z.object({
  identification: z.object({
    isPlant: z.boolean().describe('Indica si la imagen es de una planta o no.'),
    commonName: z.string().describe('El nombre común de la planta identificada.'),
    latinName: z.string().describe('El nombre en latín de la planta identificada.'),
  }),
  healthDiagnosis: z.object({
    isHealthy: z.boolean().describe('Indica si la planta está sana o no.'),
    diagnosis: z
      .string()
      .describe(
        'Diagnóstico muy breve (2–3 palabras), por ejemplo: "Oídio", "Pulgones", "Deficiencia de nitrógeno".'
      ),
    recommendations: z
      .string()
      .describe(
        'Recomendaciones detalladas. Usa <strong> subtítulos </strong> con <br> al final de cada uno.'
      ),
  }),
  // Siempre presente (array vacío si no hay coincidencias).
  recommendedProducts: z.array(ProductSchema),
});
export type AnalyzePlantHealthOutput = z.infer<typeof AnalyzePlantHealthOutputSchema>;

/* ---------------------------- Helper functions -------------------------- */

function normalize(q: string) {
  return q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function expandQuery(q: string): string[] {
  const nq = normalize(q);
  const map: Record<string, string[]> = {
    oidio: ['oidio', 'hongos', 'fungicida', 'azufre', 'bicarbonato'],
    pulgones: ['pulgones', 'pulgon', 'insecticida', 'jabon potasico', 'neem'],
    'arana roja': ['arana roja', 'acaro', 'acaricida', 'mite'],
    mildiu: ['mildiu', 'fungicida', 'cobre'],
    cochinilla: ['cochinilla', 'insecticida', 'aceite'],
    'mosca blanca': ['mosca blanca', 'insecticida', 'neem', 'trampa'],
    'deficiencia de nitrogeno': ['nitrogeno', 'urea', 'fertilizante', 'abono', '11-30-11'],
    'deficiencia de fosforo': ['fosforo', 'superfosfato', 'fertilizante', 'abono', '11-30-11'],
    'deficiencia de potasio': ['potasio', 'potasico', 'fertilizante', 'abono'],
  };
  return map[nq] ?? [nq, ...nq.split(/\s+/).filter(Boolean)];
}

/* --------------------------------- Tool --------------------------------- */
/** The LLM will call this ONCE. Internally we widen recall with synonyms. */
const productSearchTool = ai.defineTool(
  {
    name: 'productSearch',
    description:
      'Busca en el catálogo productos relevantes (pesticidas, fungicidas, fertilizantes) basándose en el diagnóstico.',
    inputSchema: z.object({
      query: z.string().describe('Usa el diagnóstico como término principal.'),
    }),
    outputSchema: z.array(ProductSchema),
  },
  async (input) => {
    const terms = expandQuery(input.query);
    console.log('productSearch terms =>', terms);

    const seen = new Set<string>();
    const merged: CatalogProduct[] = [];

    for (const t of terms) {
      const res = await searchProducts(t); // tu función a Firestore
      for (const p of res ?? []) {
        const key = (p as any).id ?? `${(p as any).name}|${(p as any).image ?? ''}`;
        if (seen.has(key)) continue;
        seen.add(key);

        merged.push({
          id: (p as any).id,
          name: (p as any).name,
          price: String((p as any).price ?? ''),
          image: (p as any).image ?? '',
          aiHint: (p as any).aiHint,
        });
      }
      if (merged.length >= 3) break; // limita a 3
    }

    return merged.slice(0, 3);
  }
);

/* -------------------------------- Prompt -------------------------------- */

const analyzePlantHealthPrompt = ai.definePrompt({
  name: 'analyzePlantHealthPrompt',
  model: 'googleai/gemini-1.5-pro-latest',
  tools: [productSearchTool],
  output: { schema: AnalyzePlantHealthOutputSchema, format: 'json' },
  config: { temperature: 0.2 },
  prompt: `Eres un experto botánico y agrónomo. Tu única tarea es devolver un objeto JSON VÁLIDO que siga el esquema proporcionado. Sigue estos pasos:

1) Analiza la entrada:
   - Foto: {{#if photoDataUri}}{{media url=photoDataUri}}{{else}}No proporcionada{{/if}}
   - Descripción: {{{description}}}

2) Completa 'identification' y 'healthDiagnosis'.
   - 'diagnosis' debe ser MUY breve (ej: "Oídio", "Pulgones", "Deficiencia de nitrógeno").
   - 'recommendations' en HTML simple con subtítulos en <strong> y un <br> tras cada subtítulo.

3) Búsqueda de productos (SOLO si isHealthy = false):
   - Usa la herramienta 'productSearch' UNA SOLA VEZ.
   - Pasa como 'query' el valor EXACTO de 'diagnosis'.
   - Si la herramienta devuelve productos, colócalos en 'recommendedProducts'.
   - Si no devuelve nada, usa 'recommendedProducts': [].

4) Devuelve SOLO el JSON final completo, sin texto adicional.`,
});

/* --------------------------------- Flow --------------------------------- */

const analyzePlantHealthFlow = ai.defineFlow(
  {
    name: 'analyzePlantHealthFlow',
    inputSchema: AnalyzePlantHealthInputSchema,
    outputSchema: AnalyzePlantHealthOutputSchema,
  },
  async (input) => {
    const { output } = await analyzePlantHealthPrompt(input);
    if (!output) throw new Error('La IA no devolvió salida.');

    // Asegura que recommendedProducts exista siempre.
    if (!('recommendedProducts' in output) || !Array.isArray((output as any).recommendedProducts)) {
      (output as any).recommendedProducts = [];
    }

    // Fallback server-side: si está enferma y no hay productos, intenta buscar por tu cuenta.
    try {
      const unhealthy = (output as any).healthDiagnosis?.isHealthy === false;
      const dx = String((output as any).healthDiagnosis?.diagnosis ?? '').trim();
      const noProducts = !(output as any).recommendedProducts?.length;

      if (unhealthy && dx && noProducts) {
        const terms = expandQuery(dx);
        const seen = new Set<string>();
        const merged: CatalogProduct[] = [];
        for (const t of terms) {
          const res = await searchProducts(t);
          for (const p of res ?? []) {
            const key = (p as any).id ?? `${(p as any).name}|${(p as any).image ?? ''}`;
            if (seen.has(key)) continue;
            seen.add(key);
            merged.push({
              id: (p as any).id,
              name: (p as any).name,
              price: String((p as any).price ?? ''),
              image: (p as any).image ?? '',
              aiHint: (p as any).aiHint,
            });
          }
          if (merged.length >= 3) break;
        }
        (output as any).recommendedProducts = merged.slice(0, 3);
      }
    } catch (e) {
      console.warn('Fallback de búsqueda de productos falló:', e);
    }

    // Valida y devuelve
    return AnalyzePlantHealthOutputSchema.parse(output);
  }
);

/* ------------------------------- Public API ------------------------------ */

export async function analyzePlantHealth(
  input: AnalyzePlantHealthInput
): Promise<AnalyzePlantHealthOutput> {
  return analyzePlantHealthFlow(input);
}
