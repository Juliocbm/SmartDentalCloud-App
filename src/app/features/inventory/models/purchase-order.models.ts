/**
 * Modelos para gestión de órdenes de compra
 */

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: Date;
  expectedDate?: Date;
  receivedDate?: Date;
  status: PurchaseOrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
  items: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  productCode?: string;
  productName?: string;
  unit?: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
  receivedQuantity: number;
  notes?: string;
}

export interface CreatePurchaseOrderRequest {
  supplierId: string;
  expectedDate?: Date;
  notes?: string;
  items: CreatePurchaseOrderItemRequest[];
}

export interface CreatePurchaseOrderItemRequest {
  productId: string;
  quantity: number;
  unitCost: number;
  notes?: string;
}

export interface ReceivePurchaseOrderRequest {
  receivedItems: ReceivePurchaseOrderItemRequest[];
}

export interface ReceivePurchaseOrderItemRequest {
  id: string;
  receivedQuantity: number;
}

/**
 * Estados de orden de compra (definidos en backend Domain Entity)
 * Draft: Borrador inicial
 * Sent: Enviada al proveedor
 * Received: Recibida completamente
 * Cancelled: Cancelada
 */
export type PurchaseOrderStatus = 'Draft' | 'Sent' | 'Received' | 'Cancelled';

/**
 * Labels para estados
 */
export const PURCHASE_ORDER_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  Draft: 'Borrador',
  Sent: 'Enviada',
  Received: 'Recibida',
  Cancelled: 'Cancelada'
};
