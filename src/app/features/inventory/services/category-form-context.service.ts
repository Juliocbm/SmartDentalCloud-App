import { Injectable, signal, computed } from '@angular/core';
import { CategoryFormContext, DEFAULT_CATEGORY_CONTEXT } from '../models/category-form-context.model';

/**
 * Servicio para gestionar el contexto del formulario de categorías
 */
@Injectable({
  providedIn: 'root'
})
export class CategoryFormContextService {
  private contextState = signal<CategoryFormContext>(DEFAULT_CATEGORY_CONTEXT);

  /**
   * Contexto actual del formulario (reactivo)
   */
  context = computed(() => this.contextState());

  /**
   * Establece un nuevo contexto para el formulario
   */
  setContext(context: Partial<CategoryFormContext>): void {
    this.contextState.set({
      ...DEFAULT_CATEGORY_CONTEXT,
      ...context
    });
  }

  /**
   * Restaura el contexto a los valores por defecto
   */
  resetContext(): void {
    this.contextState.set(DEFAULT_CATEGORY_CONTEXT);
  }

  /**
   * Obtiene el contexto actual (snapshot)
   */
  getCurrentContext(): CategoryFormContext {
    return this.contextState();
  }
}
