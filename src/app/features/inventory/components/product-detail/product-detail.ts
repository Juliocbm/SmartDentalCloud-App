import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductsService } from '../../services/products.service';
import { StockService } from '../../services/stock.service';
import { Product, PRODUCT_UNITS } from '../../models/product.models';
import { Stock, StockMovement } from '../../models/stock.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { LocationsService } from '../../../settings/services/locations.service';
import { ModalService } from '../../../../shared/services/modal.service';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { AuditInfoComponent } from '../../../../shared/components/audit-info/audit-info';
import { StockAdjustmentModalComponent, StockAdjustmentModalData } from '../stock-adjustment-modal/stock-adjustment-modal';
import { StockOutputModalComponent, StockOutputModalData } from '../stock-output-modal/stock-output-modal';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { PermissionService, PERMISSIONS } from '../../../../core/services/permission.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent, AuditInfoComponent],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.scss']
})
export class ProductDetailComponent implements OnInit {
  showAuditModal = signal(false);
  showOutputModal = signal(false);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productsService = inject(ProductsService);
  private stockService = inject(StockService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);
  private location = inject(Location);
  private modalService = inject(ModalService);
  locationsService = inject(LocationsService);
  permissionService = inject(PermissionService);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Inventario', route: '/inventory/products' },
    { label: 'Productos', route: '/inventory/products' },
    { label: 'Detalle' }
  ];

  product = signal<Product | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  stockByLocation = signal<Stock[]>([]);
  loadingStock = signal(false);
  transactions = signal<StockMovement[]>([]);
  loadingTransactions = signal(false);
  activeTab = signal<'info' | 'stock' | 'history'>('info');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(id);
    } else {
      this.error.set('ID de producto no proporcionado');
      this.loading.set(false);
    }
  }

  private loadProduct(id: string): void {
    this.loading.set(true);
    this.productsService.getById(id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
        this.loadStockByLocation(id);
      },
      error: (err) => {
        this.logger.error('Error loading product:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  private loadStockByLocation(productId: string): void {
    this.loadingStock.set(true);
    this.stockService.getStockByProductLocations(productId).subscribe({
      next: (stocks) => {
        this.stockByLocation.set(stocks);
        this.loadingStock.set(false);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err, 'Error al cargar stock por sucursal'));
        this.loadingStock.set(false);
      }
    });
  }

  private loadTransactions(productId: string): void {
    this.loadingTransactions.set(true);
    this.productsService.getTransactions(productId).subscribe({
      next: (movements) => {
        this.transactions.set(movements);
        this.loadingTransactions.set(false);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err, 'Error al cargar historial'));
        this.loadingTransactions.set(false);
      }
    });
  }

  setActiveTab(tab: 'info' | 'stock' | 'history'): void {
    this.activeTab.set(tab);
    if (tab === 'history' && this.transactions().length === 0) {
      const p = this.product();
      if (p) this.loadTransactions(p.id);
    }
  }

  getMovementTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'Adjustment': 'Ajuste',
      'Purchase': 'Compra',
      'Sale': 'Venta',
      'Transfer': 'Transferencia',
      'Loss': 'Pérdida',
      'Usage': 'Uso',
      'Return': 'Devolución'
    };
    return labels[type] || type;
  }

  getMovementTypeClass(type: string): string {
    if (type === 'Purchase' || type === 'Return') return 'badge-success';
    if (type === 'Adjustment') return 'badge-info';
    if (type === 'Loss') return 'badge-error';
    return 'badge-warning';
  }

  goBack(): void {
    this.location.back();
  }

  editProduct(): void {
    const product = this.product();
    if (!product) return;
    this.router.navigate(['/inventory/products', product.id, 'edit']);
  }

  getUnitLabel(unit: string): string {
    const found = PRODUCT_UNITS.find(u => u.value === unit);
    return found ? found.label : unit;
  }

  getStockStatus(product: Product): { label: string; class: string } {
    const stock = product.currentStock ?? 0;
    if (stock <= 0) return { label: 'Sin stock', class: 'badge-error' };
    if (stock <= product.reorderPoint) return { label: 'Stock bajo', class: 'badge-warning' };
    return { label: 'Normal', class: 'badge-success' };
  }

  formatCurrency(value: number | undefined): string {
    if (value == null) return '—';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  openAdjustmentModal(locationId?: string | null, locationStock?: number): void {
    const p = this.product();
    if (!p) return;

    const modalData: StockAdjustmentModalData = {
      productId: p.id,
      locationId: locationId,
      productCode: p.code,
      productName: p.name,
      currentStock: locationStock ?? p.currentStock ?? 0,
      unit: p.unit
    };

    const modalRef = this.modalService.open<StockAdjustmentModalData, boolean>(
      StockAdjustmentModalComponent,
      { data: modalData }
    );

    modalRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProduct(p.id);
      }
    });
  }

  openOutputModal(locationId?: string | null, locationStock?: number): void {
    const p = this.product();
    if (!p) return;

    if (!locationId && this.stockByLocation().length > 0) {
      locationId = this.stockByLocation()[0].locationId;
      locationStock = this.stockByLocation()[0].currentStock;
    }

    const modalData: StockOutputModalData = {
      productId: p.id,
      locationId: locationId,
      productCode: p.code,
      productName: p.name,
      currentStock: locationStock ?? p.currentStock ?? 0,
      unit: p.unit
    };

    const modalRef = this.modalService.open<StockOutputModalData, boolean>(
      StockOutputModalComponent,
      { data: modalData }
    );

    modalRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProduct(p.id);
      }
    });
  }
}
