/// Interfaces para categorías de productos

/**
 * Categoría de productos
 */
export interface Category {
  id: string;
  name: string;
  description?: string;
  parentCategoryId?: string;
  parentCategoryName?: string;
  isActive: boolean;
  createdAt: Date;
}

/**
 * Request para crear una categoría
 */
export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentCategoryId?: string;
}

/**
 * Request para actualizar una categoría
 */
export interface UpdateCategoryRequest {
  name: string;
  description?: string;
  parentCategoryId?: string;
  isActive: boolean;
}
