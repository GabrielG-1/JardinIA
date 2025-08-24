import { config } from 'dotenv';
// Load environment variables from a .env file into process.env
// The path may need to be adjusted based on your project structure.
// This ensures that server-side code can access environment variables.
config({ path: '.env' });

import '@/ai/flows/analyze-plant-health.ts';
import '@/ai/flows/analyze-tip.ts';
