import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { PieChartComponent, BarChartComponent, ChartDataItem } from '../../../../shared/components/charts';
import { ProductsService } from '../../services/products.service';
import { AlertsCountService } from '../../../../core/services/alerts-count.service';
import { InventoryAnalyticsService } from '../../services/inventory-analytics.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { LocationsService } from '../../../settings/services/locations.service';
import { LocationAutocompleteComponent } from '../../../../shared/components/location-autocomplete/location-autocomplete';
import { LocationSummary } from '../../../settings/models/location.models';
import { TopProduct, ExpiringProduct, CategoryStockStatus, InventoryActivity, ACTIVITY_CONFIG } from '../../models/inventory-analytics.models';
import { ROUTES } from '../../../../core/constants/routes.constants';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { FormAlertComponent } from '../../../../shared/components/form-alert/form-alert';

@Component({
  selector: 'app-inventory-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, PieChartComponent, BarChartComponent, LocationAutocompleteComponent, EmptyStateComponent, FormAlertComponent],
  templateUrl: './inventory-dashboard.html',
  styleUrls: ['./inventory-dashboard.scss']
})
export class InventoryDashboardComponent implements OnInit {
  private productsService = inject(ProductsService);
  private alertsService = inject(AlertsCountService);
  private analyticsService = inject(InventoryAnalyticsService);
  private logger = inject(LoggingService);
  locationsService = inject(LocationsService);

  selectedLocationId = signal<string | null>(null);

  loading = signal(true);
  error = signal<string | null>(null);

  // Métricas básicas
  totalProducts = signal(0);
  totalInventoryValue = signal(0);
  
  // Fase 1: Nuevas secciones
  loadingTopProducts = signal(false);
  topProducts = signal<TopProduct[]>([]);
  
  loadingExpiring = signal(false);
  expiringProducts = signal<ExpiringProduct[]>([]);
  
  // Fase 2: Gráficas y Timeline
  loadingCategories = signal(false);
  categoryDistribution = signal<CategoryStockStatus[]>([]);
  
  loadingActivity = signal(false);
  recentActivity = signal<InventoryActivity[]>([]);
  
  // Configuración de actividades (iconos y colores)
  activityConfig = ACTIVITY_CONFIG;

  // KPIs derivados
  totalCategories = computed(() => this.categoryDistribution().length);
  lowStockProducts = computed(() => {
    const cats = this.categoryDistribution();
    return cats.reduce((sum, c) => sum + c.lowStockCount, 0);
  });
  
  // ✅ Reutilizar servicio global de alertas
  criticalAlerts = this.alertsService.criticalAlerts;
  warningAlerts = this.alertsService.warningAlerts;
  totalAlerts = this.alertsService.totalAlerts;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: ROUTES.DASHBOARD, icon: 'fa-home' },
    { label: 'Inventario' }
  ];

  ngOnInit(): void {
    this.loadAllData();
  }

  onLocationSelected(location: LocationSummary | null): void {
    this.selectedLocationId.set(location?.id ?? null);
    this.loadAllData();
  }

  private loadAllData(): void {
    this.loadDashboardData();
    this.loadInventoryValue();
    this.loadTopProducts();
    this.loadExpiringProducts();
    this.loadCategoryDistribution();
    this.loadRecentActivity();
  }

  private loadDashboardData(): void {
    this.loading.set(true);
    this.productsService.getAll().subscribe({
      next: (products) => {
        this.totalProducts.set(products.length);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading dashboard data:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  private loadInventoryValue(): void {
    this.analyticsService.calculateInventoryValue(this.selectedLocationId()).subscribe({
      next: (value) => this.totalInventoryValue.set(value),
      error: (err) => this.logger.error('Error calculating inventory value:', err)
    });
  }

  private loadTopProducts(): void {
    this.loadingTopProducts.set(true);
    this.analyticsService.getTopProducts(5, this.selectedLocationId()).subscribe({
      next: (products) => {
        this.topProducts.set(products);
        this.loadingTopProducts.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading top products:', err);
        this.loadingTopProducts.set(false);
      }
    });
  }

  private loadExpiringProducts(): void {
    this.loadingExpiring.set(true);
    this.analyticsService.getExpiringProducts(30, this.selectedLocationId()).subscribe({
      next: (products) => {
        this.expiringProducts.set(products);
        this.loadingExpiring.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading expiring products:', err);
        this.loadingExpiring.set(false);
      }
    });
  }

  private loadCategoryDistribution(): void {
    this.loadingCategories.set(true);
    this.analyticsService.getCategoryDistribution(this.selectedLocationId()).subscribe({
      next: (categories) => {
        this.categoryDistribution.set(categories);
        this.loadingCategories.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading category distribution:', err);
        this.loadingCategories.set(false);
      }
    });
  }

  private loadRecentActivity(): void {
    this.loadingActivity.set(true);
    this.analyticsService.getRecentActivity(5, this.selectedLocationId()).subscribe({
      next: (activities) => {
        this.recentActivity.set(activities);
        this.loadingActivity.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading recent activity:', err);
        this.loadingActivity.set(false);
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }

  getActivityIcon(type: string): string {
    return this.activityConfig[type as keyof typeof this.activityConfig]?.icon || 'fa-circle';
  }

  getActivityColor(type: string): string {
    const color = this.activityConfig[type as keyof typeof this.activityConfig]?.color || 'info';
    return 'dash-item__leading--' + color;
  }

  getExpiryLeadingClass(urgencyLevel: string): string {
    const classes: Record<string, string> = {
      'critical': 'dash-item__leading--error',
      'warning': 'dash-item__leading--warning',
      'info': 'dash-item__leading--info'
    };
    return classes[urgencyLevel] || 'dash-item__leading--warning';
  }

  /** Datos transformados para gráfico de categorías */
  categoryChartData = computed<ChartDataItem[]>(() =>
    this.categoryDistribution().map(cat => ({
      label: cat.categoryName,
      value: cat.totalProducts
    }))
  );

  /** Datos transformados para gráfico de top productos */
  topProductsChartData = computed<ChartDataItem[]>(() =>
    this.topProducts().map(p => ({
      label: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
      value: p.usageCount
    }))
  );
}
