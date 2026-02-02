/**
 * Modelos para gestión de stock de inventario
 */

export interface Stock {
  id: string;
  productId: string;
  productCode?: string;
  productName?: string;
  categoryName?: string;
  currentStock: number;
  minStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  unit: string;
  lastMovementDate?: Date;
  averageCost?: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName?: string;
  movementType: 'adjustment' | 'purchase' | 'sale' | 'transfer' | 'loss';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  notes?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: Date;
}

export interface StockAdjustmentRequest {
  productId: string;
  newQuantity: number;
  reason: string;
  notes?: string;
}

export interface StockAlert {
  productId: string;
  productCode: string;
  productName: string;
  categoryName?: string;
  currentStock: number;
  minStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  unit: string;
  alertLevel: 'critical' | 'warning' | 'normal';
  daysUntilOutOfStock?: number;
}

export type StockAlertLevel = 'critical' | 'warning' | 'normal';
