import type { Product } from "@/services/catalog-service";

export type CartItem = Product & {
  id: string; // id is mandatory in cart
  quantity: number;
};
