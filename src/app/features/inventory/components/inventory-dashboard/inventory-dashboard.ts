import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { ProductsService } from '../../services/products.service';
import { AlertsCountService } from '../../../../core/services/alerts-count.service';
import { InventoryAnalyticsService } from '../../services/inventory-analytics.service';
import { TopProduct, ExpiringProduct } from '../../models/inventory-analytics.models';
import { ROUTES } from '../../../../core/constants/routes.constants';

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
  imports: [CommonModule, RouterLink, PageHeaderComponent],
  templateUrl: './inventory-dashboard.html',
  styleUrls: ['./inventory-dashboard.scss']
})
export class InventoryDashboardComponent implements OnInit {
  private productsService = inject(ProductsService);
  private alertsService = inject(AlertsCountService);
  private analyticsService = inject(InventoryAnalyticsService);

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
    this.loadDashboardData();
    this.loadInventoryValue();
    this.loadTopProducts();
    this.loadExpiringProducts();
  }

  private loadDashboardData(): void {
    this.loading.set(true);
    this.productsService.getAll().subscribe({
      next: (products) => {
        this.totalProducts.set(products.length);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
        this.error.set('Error al cargar datos del dashboard');
        this.loading.set(false);
      }
    });
  }

  private loadInventoryValue(): void {
    this.analyticsService.calculateInventoryValue().subscribe({
      next: (value) => this.totalInventoryValue.set(value),
      error: (err) => console.error('Error calculating inventory value:', err)
    });
  }

  private loadTopProducts(): void {
    this.loadingTopProducts.set(true);
    this.analyticsService.getTopProducts(5).subscribe({
      next: (products) => {
        this.topProducts.set(products);
        this.loadingTopProducts.set(false);
      },
      error: (err) => {
        console.error('Error loading top products:', err);
        this.loadingTopProducts.set(false);
      }
    });
  }

  private loadExpiringProducts(): void {
    this.loadingExpiring.set(true);
    this.analyticsService.getExpiringProducts(30).subscribe({
      next: (products) => {
        this.expiringProducts.set(products);
        this.loadingExpiring.set(false);
      },
      error: (err) => {
        console.error('Error loading expiring products:', err);
        this.loadingExpiring.set(false);
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }
}
