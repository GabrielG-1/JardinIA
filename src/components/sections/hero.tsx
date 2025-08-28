
"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, Check } from 'lucide-react';
import { searchProducts } from '@/services/catalog-service';
import type { Product } from '@/services/catalog-service';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';

const formatPrice = (price: string) => {
    const number = parseInt(price.replace(/[^0-9]/g, ''), 10);
    if (isNaN(number)) {
        return price;
    }
    return `$${number.toLocaleString('es-CL')}`;
};

function SearchResultCard({ product }: { product: Product }) {
    const { addItem, getItem } = useCart();
    const [isAdded, setIsAdded] = useState(false);
    const { toast } = useToast();

    const itemInCart = getItem(product.id || product.name);

    const handleAddToCart = () => {
        addItem(product);
        toast({
            title: "Producto Añadido",
            description: `${product.name} fue añadido a tu carrito.`,
        });
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
    };
    
    return (
        <Card className="flex flex-col transition-all duration-300 hover:shadow-lg hover:scale-105 bg-background overflow-hidden">
            <div className="flex items-center p-2 gap-3">
                <Image
                    src={product.image}
                    alt={product.name}
                    width={60}
                    height={60}
                    className="rounded-md object-cover w-[60px] h-[60px]"
                />
                <div className="flex-grow overflow-hidden">
                    <p className="text-sm font-semibold truncate text-foreground">{product.name}</p>
                    <p className="text-base font-bold text-primary">{formatPrice(product.price)}</p>
                </div>
                 <Button size="sm" onClick={handleAddToCart} disabled={!!itemInCart || isAdded} className={`shrink-0 ${itemInCart || isAdded ? 'bg-green-500 hover:bg-green-600' : ''}`}>
                    {itemInCart || isAdded ? <Check /> : <ShoppingCart />}
                </Button>
            </div>
        </Card>
    );
}

export function HeroSection() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const debouncedQuery = useDebounce(query, 300);

    const performSearch = useCallback(async (searchQuery: string) => {
        if (searchQuery.trim().length < 3) {
            setResults([]);
            setIsLoading(false);
            setHasSearched(searchQuery.trim().length > 0);
            return;
        }

        setIsLoading(true);
        setHasSearched(true);
        try {
            const searchResults = await searchProducts(searchQuery);
            setResults(searchResults);
        } catch (error) {
            console.error("Error searching products:", error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        performSearch(debouncedQuery);
    }, [debouncedQuery, performSearch]);

    return (
        <section
            id="hero"
            className="relative min-h-[600px] flex items-center justify-center text-white mt-20 bg-cover bg-center py-20"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=1600&h=900&auto=format&fit=crop')" }}
        >
            <div className="absolute inset-0 bg-black/30" />

            <div className="relative z-10 text-center p-4 max-w-4xl w-full">
                <div className="bg-black/20 p-8 md:p-12 rounded-lg backdrop-blur-sm">
                    <h1 className="text-5xl md:text-7xl font-bold mb-4 font-headline text-shadow-lg">
                        Tu Aliado en el Campo y Jardín
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-2xl mx-auto">
                        Encuentra todo lo que necesitas para tus cultivos y animales. Calidad, experiencia y los mejores precios.
                    </p>
                    <div className="flex w-full max-w-xl mx-auto items-center space-x-2">
                        <div className="relative w-full">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Buscar productos, semillas, fertilizantes..."
                                className="bg-white/90 text-foreground pl-10"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {hasSearched && (
                    <div className="mt-4 max-w-xl mx-auto max-h-[40vh] overflow-y-auto bg-white/90 rounded-lg p-4 backdrop-blur-sm">
                         {isLoading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-16 w-full" />
                            </div>
                         ) : results.length > 0 ? (
                            <div className="space-y-2">
                                {results.map(product => (
                                    <SearchResultCard key={product.id || product.name} product={product} />
                                ))}
                            </div>
                         ) : (
                            <p className="text-center text-foreground p-4">No se encontraron productos.</p>
                         )}
                    </div>
                )}
            </div>
        </section>
    );
}
