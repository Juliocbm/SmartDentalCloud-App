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
import { LocationSelectorComponent } from '../../../../shared/components/location-selector/location-selector';
import { TopProduct, ExpiringProduct, CategoryStockStatus, InventoryActivity, ACTIVITY_CONFIG } from '../../models/inventory-analytics.models';
import { ROUTES } from '../../../../core/constants/routes.constants';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

interface DashboardMetric {
  label: string;
  value: number;
  icon: string;
  colorClass: string;
  route: string;
  format?: 'number' | 'currency';
}

@Component({
  selector: 'app-inventory-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, PieChartComponent, BarChartComponent, LocationSelectorComponent],
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
  
  // ✅ Reutilizar servicio global de alertas
  criticalAlerts = this.alertsService.criticalAlerts;
  warningAlerts = this.alertsService.warningAlerts;
  totalAlerts = this.alertsService.totalAlerts;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: ROUTES.DASHBOARD, icon: 'fa-home' },
    { label: 'Inventario' }
  ];

  metrics = computed<DashboardMetric[]>(() => [
    {
      label: 'Total Productos',
      value: this.totalProducts(),
      icon: 'fa-boxes-stacked',
      colorClass: 'primary',
      route: ROUTES.INVENTORY_PRODUCTS
    },
    {
      label: 'Valor Total Inventario',
      value: this.totalInventoryValue(),
      icon: 'fa-dollar-sign',
      colorClass: 'success',
      route: ROUTES.INVENTORY_PRODUCTS,
      format: 'currency'
    },
    {
      label: 'Alertas Críticas',
      value: this.criticalAlerts(),
      icon: 'fa-circle-exclamation',
      colorClass: 'critical',
      route: ROUTES.INVENTORY_ALERTS
    },
    {
      label: 'Total Alertas',
      value: this.totalAlerts(),
      icon: 'fa-bell',
      colorClass: 'info',
      route: ROUTES.INVENTORY_ALERTS
    }
  ]);

  quickActions = [
    {
      label: 'Ver Productos',
      icon: 'fa-boxes-stacked',
      route: ROUTES.INVENTORY_PRODUCTS,
      description: 'Gestionar catálogo de productos'
    },
    {
      label: 'Ver Alertas',
      icon: 'fa-triangle-exclamation',
      route: ROUTES.INVENTORY_ALERTS,
      description: 'Productos con stock crítico'
    },
    {
      label: 'Categorías',
      icon: 'fa-tags',
      route: ROUTES.INVENTORY_CATEGORIES,
      description: 'Organizar productos'
    },
    {
      label: 'Proveedores',
      icon: 'fa-truck',
      route: ROUTES.INVENTORY_SUPPLIERS,
      description: 'Gestionar proveedores'
    }
  ];

  ngOnInit(): void {
    this.loadAllData();
  }

  onLocationChange(locationId: string | null): void {
    this.selectedLocationId.set(locationId);
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
    this.analyticsService.calculateInventoryValue().subscribe({
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
    this.analyticsService.getCategoryDistribution().subscribe({
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
    this.analyticsService.getRecentActivity(5).subscribe({
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
    return this.activityConfig[type as keyof typeof this.activityConfig]?.color || 'info';
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
