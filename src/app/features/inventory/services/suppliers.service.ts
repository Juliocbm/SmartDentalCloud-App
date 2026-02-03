import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { 
  Supplier, 
  CreateSupplierRequest, 
  UpdateSupplierRequest 
} from '../models/supplier.models';

/**
 * Servicio para gestión de proveedores
 */
@Injectable({
  providedIn: 'root'
})
export class SuppliersService {
  private api = inject(ApiService);
  private readonly baseUrl = '/suppliers';

  /**
   * Obtiene todos los proveedores
   */
  getAll(activeOnly: boolean = false): Observable<Supplier[]> {
    const params = activeOnly ? { isActive: true } : {};
    return this.api.get<Supplier[]>(this.baseUrl, params).pipe(
      map(suppliers => suppliers.map(this.parseSupplierDates))
    );
  }

  /**
   * Obtiene un proveedor por ID
   */
  getById(id: string): Observable<Supplier> {
    return this.api.get<Supplier>(`${this.baseUrl}/${id}`).pipe(
      map(this.parseSupplierDates)
    );
  }

  /**
   * Crea un nuevo proveedor
   */
  create(data: CreateSupplierRequest): Observable<Supplier> {
    return this.api.post<Supplier>(this.baseUrl, data).pipe(
      map(this.parseSupplierDates)
    );
  }

  /**
   * Actualiza un proveedor existente
   */
  update(id: string, data: UpdateSupplierRequest): Observable<Supplier> {
    return this.api.put<Supplier>(`${this.baseUrl}/${id}`, data).pipe(
      map(this.parseSupplierDates)
    );
  }

  /**
   * Elimina (desactiva) un proveedor
   */
  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Parsea las fechas del proveedor
   */
  private parseSupplierDates(supplier: Supplier): Supplier {
    return {
      ...supplier,
      createdAt: new Date(supplier.createdAt)
    };
  }
}
