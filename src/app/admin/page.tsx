"use client"

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCatalog } from '@/services/catalog-service';
import type { Category } from '@/services/catalog-service';
import { FileManager } from '@/components/dashboard/file-manager';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboardPage() {
    const [catalog, setCatalog] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = getCatalog((data) => {
            setCatalog(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const allProducts = catalog.flatMap(category => 
        category.products.map(product => ({
            ...product,
            id: `${category.id}-${product.name}`,
            source: product.image,
            categoryName: category.name,
            categoryId: category.id,
        }))
    );

    return (
        <div className="p-4 sm:p-6">
            <h1 className="text-2xl font-bold mb-6">Panel de Administración</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Gestor de Imágenes de Productos</CardTitle>
                    <CardDescription>
                        Aquí puedes visualizar y cambiar las imágenes de todos los productos del catálogo. 
                        Haz clic en una imagen para subir un reemplazo.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                            {Array.from({ length: 16 }).map((_, i) => <Skeleton key={i} className="w-full h-32 rounded-lg" />)}
                         </div>
                    ) : (
                        <FileManager files={allProducts} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
