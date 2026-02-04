/// Interfaces para el módulo de productos de inventario

/**
 * Producto de inventario
 */
export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  unit: string;
  minStock: number;
  maxStock?: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  price?: number; // Precio de venta
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
  currentStock?: number;
  availableStock?: number;
  averageCost?: number;
  usageCount?: number; // Contador de usos/rotación
  expiryDate?: Date; // Fecha de vencimiento
  lotNumber?: string; // Número de lote
  thumbnailUrl?: string; // URL de imagen miniatura
}

/**
 * Request para crear un producto
 */
export interface CreateProductRequest {
  code: string;
  name: string;
  description?: string;
  categoryId?: string;
  unit: string;
  minStock: number;
  maxStock?: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  notes?: string;
}

/**
 * Request para actualizar un producto
 */
export interface UpdateProductRequest {
  code: string;
  name: string;
  description?: string;
  categoryId?: string;
  unit: string;
  minStock: number;
  maxStock?: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  notes?: string;
  isActive: boolean;
}

/**
 * Filtros para la lista de productos
 */
export interface ProductFilters {
  searchTerm?: string;
  categoryId?: string;
  isActive?: boolean | null;
}

/**
 * Unidades de medida comunes para productos dentales
 */
export const PRODUCT_UNITS = [
  { value: 'pz', label: 'Pieza' },
  { value: 'caja', label: 'Caja' },
  { value: 'paquete', label: 'Paquete' },
  { value: 'ml', label: 'Mililitros' },
  { value: 'g', label: 'Gramos' },
  { value: 'kg', label: 'Kilogramos' },
  { value: 'rollo', label: 'Rollo' },
  { value: 'sobre', label: 'Sobre' },
  { value: 'tubo', label: 'Tubo' },
  { value: 'frasco', label: 'Frasco' }
] as const;
