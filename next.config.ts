import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'genkit',
    '@genkit-ai/googleai',
    '@genkit-ai/firebase',
    '@genkit-ai/next',
    'handlebars',
    'dotprompt',
  ],
  experimental: {
    serverActions: {
      // Las fotos del asesor IA se envían como data URI a la server action.
      bodySizeLimit: '5mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
