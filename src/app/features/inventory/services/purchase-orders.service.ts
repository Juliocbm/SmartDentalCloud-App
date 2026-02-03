import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { 
  PurchaseOrder, 
  CreatePurchaseOrderRequest,
  ReceivePurchaseOrderRequest,
  PurchaseOrderStatus
} from '../models/purchase-order.models';

/**
 * Servicio para gestión de órdenes de compra
 */
@Injectable({
  providedIn: 'root'
})
export class PurchaseOrdersService {
  private api = inject(ApiService);
  private readonly baseUrl = '/purchase-orders';

  /**
   * Obtiene todas las órdenes de compra
   */
  getAll(status?: PurchaseOrderStatus): Observable<PurchaseOrder[]> {
    const params = status ? { status } : {};
    return this.api.get<PurchaseOrder[]>(this.baseUrl, params).pipe(
      map(orders => orders.map(this.parsePurchaseOrderDates))
    );
  }

  /**
   * Obtiene una orden de compra por ID
   */
  getById(id: string): Observable<PurchaseOrder> {
    return this.api.get<PurchaseOrder>(`${this.baseUrl}/${id}`).pipe(
      map(this.parsePurchaseOrderDates)
    );
  }

  /**
   * Obtiene órdenes por proveedor
   */
  getBySupplier(supplierId: string): Observable<PurchaseOrder[]> {
    return this.api.get<PurchaseOrder[]>(`${this.baseUrl}/supplier/${supplierId}`).pipe(
      map(orders => orders.map(this.parsePurchaseOrderDates))
    );
  }

  /**
   * Crea una nueva orden de compra
   */
  create(data: CreatePurchaseOrderRequest): Observable<PurchaseOrder> {
    return this.api.post<PurchaseOrder>(this.baseUrl, data).pipe(
      map(this.parsePurchaseOrderDates)
    );
  }

  /**
   * Recibe mercancía de una orden
   */
  receive(id: string, data: ReceivePurchaseOrderRequest): Observable<PurchaseOrder> {
    return this.api.post<PurchaseOrder>(`${this.baseUrl}/${id}/receive`, data).pipe(
      map(this.parsePurchaseOrderDates)
    );
  }

  /**
   * Cancela una orden de compra
   */
  cancel(id: string): Observable<void> {
    return this.api.post<void>(`${this.baseUrl}/${id}/cancel`, {});
  }

  /**
   * Parsea las fechas de la orden
   */
  private parsePurchaseOrderDates(order: PurchaseOrder): PurchaseOrder {
    return {
      ...order,
      orderDate: new Date(order.orderDate),
      expectedDate: order.expectedDate ? new Date(order.expectedDate) : undefined,
      receivedDate: order.receivedDate ? new Date(order.receivedDate) : undefined,
      createdAt: new Date(order.createdAt),
      updatedAt: order.updatedAt ? new Date(order.updatedAt) : undefined
    };
  }
}
