export type MovementType = "entrada" | "salida" | "ajuste";

export type StockMovement = {
  id: string;
  productId: string;
  productName: string;
  categoryId: string;
  type: MovementType;
  quantity: number;
  stockAnterior: number;
  stockNuevo: number;
  createdAt: string;
  note?: string;
};
