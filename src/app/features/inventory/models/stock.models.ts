/**
 * Modelos para gestión de stock de inventario
 */

export interface Stock {
  id: string;
  productId: string;
  locationId?: string | null;
  locationName?: string | null;
  productCode?: string;
  productName?: string;
  categoryName?: string;
  currentStock: number;
  reservedStock?: number;
  availableStock?: number;
  minStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  unit: string;
  lastMovementDate?: Date;
  averageCost?: number;
  lastCost?: number;
  totalValue?: number;
  stockStatus?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  locationId?: string | null;
  productName?: string;
  movementType: 'Adjustment' | 'Purchase' | 'Sale' | 'Transfer' | 'Loss' | 'Usage' | 'Return';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  notes?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: Date;
}

/**
 * Request para ajustar stock manualmente.
 * quantity: Diferencia a aplicar (+entrada, -salida)
 */
export interface StockAdjustmentRequest {
  productId: string;
  quantity: number;
  reason: string;
}

export interface StockAlert {
  productId: string;
  locationId?: string | null;
  locationName?: string | null;
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
