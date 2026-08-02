import type { Metadata, Viewport } from 'next';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Alegreya } from 'next/font/google';
import { CartProvider } from '@/hooks/use-cart';
import { AuthProvider } from '@/hooks/use-auth';

const alegreya = Alegreya({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-alegreya',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
};

export const metadata: Metadata = {
  title: 'JardínIA',
  description: 'Tu Aliado en el Campo y Jardín - Jardín y Huerta Labranza (JHL)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${alegreya.variable} antialiased`} suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          as="image"
          href="https://firebasestorage.googleapis.com/v0/b/jardnia.firebasestorage.app/o/assets%2FHeroImage.jpg?alt=media&token=693c548b-a8cc-4f94-8eeb-f54806b5b858"
        />
      </head>
      <body className="font-body">
        <AuthProvider>
          <CartProvider>
            <div className="flex flex-col min-h-screen bg-background">
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
