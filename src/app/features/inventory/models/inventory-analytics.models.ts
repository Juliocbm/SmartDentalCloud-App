/**
 * Modelos para Analytics del Inventario
 * Contiene interfaces y tipos para análisis y métricas del dashboard
 */

/**
 * Valor total del inventario
 */
export interface InventoryValue {
  totalValue: number;
  currency: string;
  lastUpdated: Date;
}

/**
 * Producto con mayor rotación/uso
 */
export interface TopProduct {
  id: string;
  name: string;
  code: string;
  usageCount: number;
  currentStock: number;
  stockStatus: 'critical' | 'warning' | 'normal';
  categoryName: string;
  thumbnailUrl?: string;
}

/**
 * Producto próximo a vencer
 */
export interface ExpiringProduct {
  id: string;
  name: string;
  code: string;
  expiryDate: Date;
  daysToExpire: number;
  currentStock: number;
  lotNumber?: string;
  urgencyLevel: 'critical' | 'warning' | 'info';
}

/**
 * Datos de tendencia de stock
 */
export interface StockTrendData {
  date: Date;
  totalStock: number;
  criticalStock: number;
  warningStock: number;
  restockEvents: number;
}

/**
 * Configuración para tendencias de stock
 */
export interface StockTrendConfig {
  period: 'week' | 'month' | 'quarter';
  groupBy: 'day' | 'week' | 'month';
}

/**
 * Tipo de actividad en el inventario
 */
export type ActivityType = 
  | 'product_added'
  | 'stock_updated'
  | 'alert_generated'
  | 'purchase_order_created'
  | 'product_expired'
  | 'restock';

/**
 * Actividad del inventario
 */
export interface InventoryActivity {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: Date;
  metadata?: {
    productId?: string;
    productName?: string;
    quantity?: number;
    userId?: string;
    userName?: string;
  };
}

/**
 * Configuración de iconos y colores por tipo de actividad
 */
export const ACTIVITY_CONFIG: Record<ActivityType, { icon: string; color: string }> = {
  product_added: { icon: 'fa-plus-circle', color: 'success' },
  stock_updated: { icon: 'fa-arrows-rotate', color: 'info' },
  alert_generated: { icon: 'fa-triangle-exclamation', color: 'warning' },
  purchase_order_created: { icon: 'fa-file-invoice', color: 'primary' },
  product_expired: { icon: 'fa-calendar-xmark', color: 'error' },
  restock: { icon: 'fa-box', color: 'success' }
};

/**
 * Estado de categoría por stock
 */
export interface CategoryStockStatus {
  categoryId: string;
  categoryName: string;
  totalProducts: number;
  lowStockCount: number;
  criticalStockCount: number;
  percentage: number;
  status: 'critical' | 'warning' | 'normal';
}

/**
 * Datos de tendencia para métricas
 */
export interface MetricTrend {
  current: number;
  previous: number;
  percentChange: number;
  direction: 'up' | 'down' | 'neutral';
}
