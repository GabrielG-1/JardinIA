import type { Product } from "@/services/catalog-service";

export type CartItem = Omit<Product, 'id'> & {
  id: string; // id is mandatory and must be a string in cart
  quantity: number;
};
