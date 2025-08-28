import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// App Hosting and Next.js automatically handle loading environment variables.
// The GEMINI_API_KEY is retrieved directly from the process environment.

export const ai = genkit({
  plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY})],
});
