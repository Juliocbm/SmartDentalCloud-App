import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { 
  Category, 
  CreateCategoryRequest, 
  UpdateCategoryRequest 
} from '../models/category.models';

/**
 * Servicio para gestión de categorías de productos
 */
@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  private api = inject(ApiService);
  private readonly baseUrl = '/categories';

  /**
   * Obtiene todas las categorías
   * @param isActive Filtro opcional por estado
   */
  getAll(isActive?: boolean): Observable<Category[]> {
    let params = '';
    if (isActive !== undefined) {
      params = `?isActive=${isActive}`;
    }
    return this.api.get<Category[]>(`${this.baseUrl}${params}`).pipe(
      map(categories => categories.map(this.parseCategoryDates))
    );
  }

  /**
   * Obtiene una categoría por ID
   */
  getById(id: string): Observable<Category> {
    return this.api.get<Category>(`${this.baseUrl}/${id}`).pipe(
      map(this.parseCategoryDates)
    );
  }

  /**
   * Crea una nueva categoría
   */
  create(data: CreateCategoryRequest): Observable<Category> {
    return this.api.post<Category>(this.baseUrl, data).pipe(
      map(this.parseCategoryDates)
    );
  }

  /**
   * Actualiza una categoría existente
   */
  update(id: string, data: UpdateCategoryRequest): Observable<Category> {
    return this.api.put<Category>(`${this.baseUrl}/${id}`, data).pipe(
      map(this.parseCategoryDates)
    );
  }

  /**
   * Elimina una categoría
   */
  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Parsea las fechas de la categoría
   */
  private parseCategoryDates(category: Category): Category {
    return {
      ...category,
      createdAt: new Date(category.createdAt)
    };
  }
}
