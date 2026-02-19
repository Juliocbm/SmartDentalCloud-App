import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Stock, StockMovement, StockAlert, StockAdjustmentRequest } from '../models/stock.models';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private api = inject(ApiService);
  private baseUrl = '/stock';

  /**
   * Obtiene alertas de stock bajo
   */
  getAlerts(): Observable<StockAlert[]> {
    return this.api.get<StockAlert[]>(`${this.baseUrl}/low-stock-alerts`).pipe(
      map(alerts => alerts.map(this.parseStockAlertDates))
    );
  }

  /**
   * Obtiene el stock de un producto
   */
  getByProductId(productId: string): Observable<Stock> {
    return this.api.get<Stock>(`${this.baseUrl}/product/${productId}`).pipe(
      map(this.parseStockDates)
    );
  }

  /**
   * Ajusta manualmente el stock de un producto
   */
  adjustStock(request: StockAdjustmentRequest): Observable<Stock> {
    return this.api.post<Stock>(`${this.baseUrl}/adjust`, request).pipe(
      map(this.parseStockDates)
    );
  }

  /**
   * Obtiene el historial de movimientos de un producto
   */
  getMovements(productId: string): Observable<StockMovement[]> {
    return this.api.get<StockMovement[]>(`${this.baseUrl}/movements/${productId}`).pipe(
      map(movements => movements.map(this.parseMovementDates))
    );
  }

  /**
   * Obtiene todos los movimientos de stock
   */
  getAllMovements(): Observable<StockMovement[]> {
    return this.api.get<StockMovement[]>(`${this.baseUrl}/movements`).pipe(
      map(movements => movements.map(this.parseMovementDates))
    );
  }

  private parseStockDates(stock: Stock): Stock {
    return {
      ...stock,
      lastMovementDate: stock.lastMovementDate ? new Date(stock.lastMovementDate) : undefined
    };
  }

  private parseStockAlertDates(alert: StockAlert): StockAlert {
    return alert;
  }

  private parseMovementDates(movement: StockMovement): StockMovement {
    return {
      ...movement,
      createdAt: new Date(movement.createdAt)
    };
  }
}
