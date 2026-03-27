import { Injectable, signal, computed, inject } from '@angular/core';
import { StockService } from '../../features/inventory/services/stock.service';
import { StockAlert } from '../../features/inventory/models/stock.models';
import { interval, startWith, switchMap } from 'rxjs';
import { LoggingService } from './logging.service';

/**
 * Servicio global para gestionar el contador de alertas de stock
 * Usa el endpoint de alertas del backend como fuente única de verdad
 */
@Injectable({
  providedIn: 'root'
})
export class AlertsCountService {
  private stockService = inject(StockService);
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
        switchMap(() => this.stockService.getAlerts())
      )
      .subscribe({
        next: (alerts) => {
          this.calculateAlerts(alerts);
        },
        error: (err) => {
          this.logger.error('Error refreshing alerts count:', err);
        }
      });
  }

  reset(): void {
    this.criticalCount.set(0);
    this.warningCount.set(0);
  }

  /**
   * Refresca manualmente el contador de alertas
   */
  refresh(): void {
    this.stockService.getAlerts().subscribe({
      next: (alerts) => {
        this.calculateAlerts(alerts);
      },
      error: (err) => {
        this.logger.error('Error refreshing alerts count:', err);
      }
    });
  }

  /**
   * Calcula alertas críticas y advertencias desde el endpoint de alertas
   */
  private calculateAlerts(alerts: StockAlert[]): void {
    const critical = alerts.filter(a => a.alertLevel === 'critical').length;
    const warning = alerts.filter(a => a.alertLevel === 'warning').length;

    this.criticalCount.set(critical);
    this.warningCount.set(warning);
  }
}
