
"use client";

import { Leaf } from 'lucide-react';
import { getLogoUrl } from '@/services/settings-service';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export function Icons() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLogoUrl()
      .then(setLogoUrl)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />;
  }
  
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt="Logo de la tienda"
        width={48}
        height={48}
        className="h-12 w-12 object-contain"
        priority
      />
    );
  }

  // Fallback a un ícono por defecto si no hay logo personalizado
  return <Leaf className="h-8 w-8 text-primary" />;
}
