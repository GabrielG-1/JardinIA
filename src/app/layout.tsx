import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Alegreya } from 'next/font/google';

const alegreya = Alegreya({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-alegreya',
});

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
      <body className="font-body">
        <div className="flex flex-col min-h-screen bg-background">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
