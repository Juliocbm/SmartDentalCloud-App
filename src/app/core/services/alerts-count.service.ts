import { Injectable, signal, computed, inject } from '@angular/core';
import { ProductsService } from '../../features/inventory/services/products.service';
import { Product } from '../../features/inventory/models/product.models';
import { interval, startWith, switchMap } from 'rxjs';
import { LoggingService } from './logging.service';

/**
 * Servicio global para gestionar el contador de alertas de stock
 * Proporciona un signal reactivo con el total de alertas críticas y advertencias
 */
@Injectable({
  providedIn: 'root'
})
export class AlertsCountService {
  private productsService = inject(ProductsService);
  private logger = inject(LoggingService);

  private criticalCount = signal(0);
  private warningCount = signal(0);

  /**
   * Total de alertas (críticas + advertencias)
   */
  totalAlerts = computed(() => this.criticalCount() + this.warningCount());

  /**
   * Solo alertas críticas
   */
  criticalAlerts = computed(() => this.criticalCount());

  /**
   * Solo advertencias
   */
  warningAlerts = computed(() => this.warningCount());

  constructor() {
    this.startAutoRefresh();
  }

  /**
   * Inicia el auto-refresh cada 5 minutos
   */
  private startAutoRefresh(): void {
    interval(5 * 60 * 1000) // 5 minutos
      .pipe(
        startWith(0), // Ejecutar inmediatamente
        switchMap(() => this.productsService.getAll())
      )
      .subscribe({
        next: (products) => {
          this.calculateAlerts(products);
        },
        error: (err) => {
          this.logger.error('Error refreshing alerts count:', err);
        }
      });
  }

  /**
   * Refresca manualmente el contador de alertas
   */
  refresh(): void {
    this.productsService.getAll().subscribe({
      next: (products) => {
        this.calculateAlerts(products);
      },
      error: (err) => {
        this.logger.error('Error refreshing alerts count:', err);
      }
    });
  }

  /**
   * Calcula alertas críticas y advertencias
   */
  private calculateAlerts(products: Product[]): void {
    const critical = products.filter(p => 
      p.currentStock !== undefined && p.currentStock <= p.minStock
    ).length;

    const warning = products.filter(p => 
      p.currentStock !== undefined && 
      p.currentStock > p.minStock && 
      p.currentStock <= p.reorderPoint
    ).length;

    this.criticalCount.set(critical);
    this.warningCount.set(warning);
  }
}
