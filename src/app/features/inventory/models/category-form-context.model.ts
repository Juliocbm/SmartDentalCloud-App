import { ROUTES } from '../../../core/constants/routes.constants';

/**
 * Contexto para el formulario de categorías
 */
export interface CategoryFormContext {
  /**
   * URL de retorno al cancelar o después de guardar
   */
  returnUrl: string;

  /**
   * ID de categoría padre preseleccionada (para crear subcategoría)
   */
  preselectedParentCategoryId: string | null;

  /**
   * Nombre de categoría padre (para mostrar en UI)
   */
  preselectedParentCategoryName: string | null;
}

/**
 * Contexto por defecto (formulario genérico desde lista)
 */
export const DEFAULT_CATEGORY_CONTEXT: CategoryFormContext = {
  returnUrl: ROUTES.INVENTORY_CATEGORIES,
  preselectedParentCategoryId: null,
  preselectedParentCategoryName: null
};

/**
 * Contexto para crear subcategoría desde una categoría padre
 */
export const SUBCATEGORY_CONTEXT = (
  parentCategoryId: string,
  parentCategoryName: string
): Partial<CategoryFormContext> => ({
  returnUrl: ROUTES.INVENTORY_CATEGORIES,
  preselectedParentCategoryId: parentCategoryId,
  preselectedParentCategoryName: parentCategoryName
});
