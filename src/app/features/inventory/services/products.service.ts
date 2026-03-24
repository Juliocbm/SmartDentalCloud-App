import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { 
  Product, 
  CreateProductRequest, 
  UpdateProductRequest 
} from '../models/product.models';
import { StockMovement, RecordStockOutputRequest } from '../models/stock.models';

/**
 * Servicio para gestión de productos de inventario
 */
@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private api = inject(ApiService);
  private readonly baseUrl = '/products';

  /**
   * Obtiene todos los productos
   * @param activeOnly Si true, solo retorna productos activos
   */
  getAll(activeOnly: boolean = false): Observable<Product[]> {
    const params = activeOnly ? '?activeOnly=true' : '';
    return this.api.get<Product[]>(`${this.baseUrl}${params}`).pipe(
      map(products => products.map(this.parseProductDates))
    );
  }

  /**
   * Obtiene un producto por ID
   */
  getById(id: string): Observable<Product> {
    return this.api.get<Product>(`${this.baseUrl}/${id}`).pipe(
      map(this.parseProductDates)
    );
  }

  /**
   * Crea un nuevo producto
   */
  create(data: CreateProductRequest): Observable<Product> {
    return this.api.post<Product>(this.baseUrl, data).pipe(
      map(this.parseProductDates)
    );
  }

  /**
   * Actualiza un producto existente
   */
  update(id: string, data: UpdateProductRequest): Observable<Product> {
    return this.api.put<Product>(`${this.baseUrl}/${id}`, data).pipe(
      map(this.parseProductDates)
    );
  }

  /**
   * Elimina un producto
   */
  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Obtiene el historial de transacciones de un producto
   */
  recordOutput(productId: string, data: RecordStockOutputRequest): Observable<void> {
    return this.api.post<void>(`${this.baseUrl}/${productId}/output`, data);
  }

  getTransactions(id: string, startDate?: string, endDate?: string): Observable<StockMovement[]> {
    const params: Record<string, string> = {};
    if (startDate) params['startDate'] = startDate;
    if (endDate) params['endDate'] = endDate;
    const query = Object.keys(params).length > 0 ? '?' + new URLSearchParams(params).toString() : '';
    return this.api.get<StockMovement[]>(`${this.baseUrl}/${id}/transactions${query}`).pipe(
      map(movements => movements.map(this.parseMovementDates))
    );
  }

  private parseMovementDates(movement: StockMovement): StockMovement {
    return {
      ...movement,
      movementDate: new Date(movement.movementDate)
    };
  }

  /**
   * Parsea las fechas del producto
   */
  private parseProductDates(product: Product): Product {
    return {
      ...product,
      createdAt: new Date(product.createdAt),
      updatedAt: product.updatedAt ? new Date(product.updatedAt) : undefined
    };
  }
}
