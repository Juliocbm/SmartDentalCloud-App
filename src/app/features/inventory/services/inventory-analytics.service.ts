import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ProductsService } from './products.service';
import { Product } from '../models/product.models';
import {
  TopProduct,
  ExpiringProduct,
  InventoryActivity,
  CategoryStockStatus,
  MetricTrend
} from '../models/inventory-analytics.models';

/**
 * Servicio de Analytics para el Dashboard de Inventario
 * Centraliza toda la lógica de análisis y cálculos de métricas
 */
@Injectable({
  providedIn: 'root'
})
export class InventoryAnalyticsService {
  private http = inject(HttpClient);
  private productsService = inject(ProductsService);
  private readonly baseUrl = `${environment.apiUrl}/products`;

  /**
   * Calcula el valor total del inventario (costo de adquisición)
   * Suma: currentStock * unitCost de todos los productos
   */
  calculateInventoryValue(): Observable<number> {
    return this.productsService.getAll().pipe(
      map(products => products.reduce((total, product) => {
        const productValue = (product.currentStock || 0) * (product.unitCost || 0);
        return total + productValue;
      }, 0))
    );
  }

  /**
   * Obtiene los productos con mayor rotación/uso desde el backend
   * @param limit Número de productos a retornar (default: 5)
   */
  getTopProducts(limit: number = 5): Observable<TopProduct[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/top-used`, { 
      params: { limit: limit.toString() } 
    }).pipe(
      map(products => products.map(p => ({
        id: p.id!,
        name: p.name,
        code: p.code,
        usageCount: p.usageCount || 0,
        currentStock: p.currentStock || 0,
        stockStatus: this.getStockStatus(p),
        categoryName: p.categoryName || 'Sin categoría',
        thumbnailUrl: p.thumbnailUrl
      })))
    );
  }

  /**
   * Obtiene productos próximos a vencer desde el backend
   * @param withinDays Días hacia adelante para buscar (default: 30)
   */
  getExpiringProducts(withinDays: number = 30): Observable<ExpiringProduct[]> {
    const today = new Date();

    return this.http.get<Product[]>(`${this.baseUrl}/expiring`, { 
      params: { withinDays: withinDays.toString() } 
    }).pipe(
      map(products => products.map(p => {
        const expiryDate = new Date(p.expiryDate!);
        const daysToExpire = Math.ceil(
          (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        return {
          id: p.id!,
          name: p.name,
          code: p.code,
          expiryDate,
          daysToExpire,
          currentStock: p.currentStock || 0,
          lotNumber: p.lotNumber,
          urgencyLevel: this.getExpiryUrgency(daysToExpire)
        };
      }))
    );
  }

  /**
   * Incrementa el contador de uso de un producto
   * @param productId ID del producto
   * @param increment Cantidad a incrementar (default: 1)
   */
  incrementProductUsage(productId: string, increment: number = 1): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/${productId}/increment-usage`, 
      null,
      { params: { increment: increment.toString() } }
    );
  }

  /**
   * Obtiene actividad reciente del inventario
   * @param limit Número de actividades a retornar (default: 10)
   */
  getRecentActivity(limit: number = 10): Observable<InventoryActivity[]> {
    // TODO: Implementar con backend real cuando esté disponible
    // Por ahora, generar actividades de muestra basadas en cambios de productos
    return this.productsService.getAll().pipe(
      map(products => {
        const activities: InventoryActivity[] = [];
        
        // Generar actividades basadas en productos
        products.slice(0, limit).forEach(product => {
          activities.push({
            id: `${product.id}-activity`,
            type: 'stock_updated',
            description: `Stock actualizado para ${product.name}`,
            timestamp: new Date(),
            metadata: {
              productId: product.id,
              productName: product.name,
              quantity: product.currentStock
            }
          });
        });
        
        return activities.sort((a, b) => 
          b.timestamp.getTime() - a.timestamp.getTime()
        );
      })
    );
  }

  /**
   * Determina el estado de stock de un producto
   */
  private getStockStatus(product: Product): 'critical' | 'warning' | 'normal' {
    const current = product.currentStock || 0;
    const min = product.minStock || 0;
    const reorder = product.reorderPoint || 0;

    if (current <= min) return 'critical';
    if (current <= reorder) return 'warning';
    return 'normal';
  }

  /**
   * Determina el nivel de urgencia de vencimiento
   */
  private getExpiryUrgency(days: number): 'critical' | 'warning' | 'info' {
    if (days <= 7) return 'critical';
    if (days <= 15) return 'warning';
    return 'info';
  }

  /**
   * Obtiene distribución de productos por categoría
   */
  getCategoryDistribution(): Observable<CategoryStockStatus[]> {
    return this.productsService.getAll().pipe(
      map(products => {
        const categoryMap = new Map<string, {
          categoryId: string;
          categoryName: string;
          products: Product[];
        }>();

        // Agrupar por categoría
        products.forEach(p => {
          const catId = p.categoryId || 'sin-categoria';
          const catName = p.categoryName || 'Sin categoría';
          
          if (!categoryMap.has(catId)) {
            categoryMap.set(catId, { categoryId: catId, categoryName: catName, products: [] });
          }
          categoryMap.get(catId)!.products.push(p);
        });

        // Calcular estadísticas por categoría
        const totalProducts = products.length;
        return Array.from(categoryMap.values()).map(cat => {
          const lowStock = cat.products.filter(p => 
            (p.currentStock || 0) <= (p.reorderPoint || 0) && (p.currentStock || 0) > (p.minStock || 0)
          ).length;
          const criticalStock = cat.products.filter(p => 
            (p.currentStock || 0) <= (p.minStock || 0)
          ).length;

          let status: 'critical' | 'warning' | 'normal' = 'normal';
          if (criticalStock > 0) status = 'critical';
          else if (lowStock > 0) status = 'warning';

          return {
            categoryId: cat.categoryId,
            categoryName: cat.categoryName,
            totalProducts: cat.products.length,
            lowStockCount: lowStock,
            criticalStockCount: criticalStock,
            percentage: totalProducts > 0 ? Math.round((cat.products.length / totalProducts) * 100) : 0,
            status
          };
        }).sort((a, b) => b.totalProducts - a.totalProducts);
      })
    );
  }

  /**
   * Obtiene la tendencia de una métrica (para comparaciones)
   * @param metric Tipo de métrica ('products' | 'alerts' | 'value')
   */
  getMetricTrend(metric: 'products' | 'alerts' | 'value'): Observable<MetricTrend> {
    // TODO: Implementar lógica real con datos históricos
    // Por ahora, retornar datos de ejemplo
    return of({
      current: 100,
      previous: 95,
      percentChange: 5,
      direction: 'up'
    });
  }

  /**
   * Calcula el porcentaje de cambio entre dos valores
   */
  calculateTrendPercentage(current: number, previous: number): {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  } {
    if (previous === 0) return { value: 0, direction: 'neutral' };
    
    const percentChange = ((current - previous) / previous) * 100;
    const direction = percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'neutral';
    
    return {
      value: Math.abs(Math.round(percentChange)),
      direction
    };
  }
}
