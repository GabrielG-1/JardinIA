// This file ensures that Genkit is loaded in the development environment.
// It also ensures that the environment variables are loaded for Genkit flows.
import { config } from 'dotenv';
config({ path: '.env' });


import '@/ai/flows/analyze-plant-health.ts';
import '@/ai/flows/analyze-tip.ts';
