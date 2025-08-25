import type { Product } from "@/services/catalog-service";

export type CartItem = Product & {
  quantity: number;
};
