
"use client";

import { Leaf } from 'lucide-react';
import { getLogoUrl } from '@/services/settings-service';
import { useEffect, useState } from 'react';
import Image from 'next/image';

// Este componente ahora es un placeholder estático para evitar llamadas a Firestore
// en la carga inicial de la página. La gestión del logo se mueve al admin dashboard.
export function Icons() {
  return <Leaf className="h-8 w-8 text-primary" />;
}
