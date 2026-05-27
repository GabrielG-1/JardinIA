import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// App Hosting and Next.js automatically handle loading environment variables.
// The GEMINI_API_KEY is retrieved directly from the process environment.
// The use of dotenv is not necessary in this context.

// **CRITICAL FIX**: Add a check for the API key.
// If the key is missing, Genkit's googleAI() plugin would be configured
// incorrectly, causing a cryptic 500 error downstream when a flow is invoked.
// By throwing an error here, we get a clear and immediate signal about
// what is wrong in the server environment.
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  console.error("CRITICAL: La variable de entorno GEMINI_API_KEY no está configurada.");
  throw new Error("La variable de entorno GEMINI_API_KEY no está configurada. El servicio de IA no puede funcionar.");
}


export const ai = genkit({
  plugins: [googleAI({apiKey: geminiApiKey})],
});
