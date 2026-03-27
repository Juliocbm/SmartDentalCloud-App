import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SuppliersService } from '../../services/suppliers.service';
import { PurchaseOrdersService } from '../../services/purchase-orders.service';
import { ProductsService } from '../../services/products.service';
import { Supplier, PAYMENT_TERMS } from '../../models/supplier.models';
import { PurchaseOrder, PurchaseOrderStatus } from '../../models/purchase-order.models';
import { Product } from '../../models/product.models';
import { LoggingService } from '../../../../core/services/logging.service';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { AuditInfoComponent } from '../../../../shared/components/audit-info/audit-info';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { PermissionService, PERMISSIONS } from '../../../../core/services/permission.service';
import { forkJoin } from 'rxjs';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-supplier-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent, AuditInfoComponent, EmptyStateComponent],
  templateUrl: './supplier-detail.html',
  styleUrls: ['./supplier-detail.scss']
})
export class SupplierDetailComponent implements OnInit {
  showAuditModal = signal(false);
  activeTab = signal<'info' | 'orders' | 'products'>('info');

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private suppliersService = inject(SuppliersService);
  private purchaseOrdersService = inject(PurchaseOrdersService);
  private productsService = inject(ProductsService);
  private logger = inject(LoggingService);
  private location = inject(Location);
  permissionService = inject(PermissionService);

  supplierOrders = signal<PurchaseOrder[]>([]);
  loadingOrders = signal(false);
  supplierProducts = signal<Product[]>([]);
  loadingProducts = signal(false);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Inventario', route: '/inventory/suppliers' },
    { label: 'Proveedores', route: '/inventory/suppliers' },
    { label: 'Detalle' }
  ];

  supplier = signal<Supplier | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSupplier(id);
    } else {
      this.error.set('ID de proveedor no proporcionado');
      this.loading.set(false);
    }
  }

  private loadSupplier(id: string): void {
    this.loading.set(true);
    this.suppliersService.getById(id).subscribe({
      next: (supplier) => {
        this.supplier.set(supplier);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading supplier:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  setActiveTab(tab: 'info' | 'orders' | 'products'): void {
    this.activeTab.set(tab);
    const sup = this.supplier();
    if (!sup) return;
    if (tab === 'orders' && this.supplierOrders().length === 0) {
      this.loadSupplierOrders(sup.id);
    }
    if (tab === 'products' && this.supplierProducts().length === 0) {
      this.loadSupplierProducts(sup.id);
    }
  }

  private loadSupplierOrders(supplierId: string): void {
    this.loadingOrders.set(true);
    this.purchaseOrdersService.getAll().subscribe({
      next: (orders) => {
        this.supplierOrders.set(orders.filter(o => o.supplierId === supplierId));
        this.loadingOrders.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading supplier orders:', err);
        this.loadingOrders.set(false);
      }
    });
  }

  private loadSupplierProducts(supplierId: string): void {
    this.loadingProducts.set(true);
    forkJoin([
      this.purchaseOrdersService.getAll(),
      this.productsService.getAll()
    ]).subscribe({
      next: ([orders, products]) => {
        const supplierOrderIds = new Set(
          orders
            .filter(o => o.supplierId === supplierId)
            .flatMap(o => o.items?.map(i => i.productId) ?? [])
        );
        this.supplierProducts.set(
          products.filter(p => supplierOrderIds.has(p.id))
        );
        this.loadingProducts.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading supplier products:', err);
        this.loadingProducts.set(false);
      }
    });
  }

  getStatusClass(status: PurchaseOrderStatus): string {
    const map: Record<PurchaseOrderStatus, string> = {
      'Draft': 'badge-secondary',
      'Sent': 'badge-info',
      'PartialReceived': 'badge-warning',
      'Received': 'badge-success',
      'Cancelled': 'badge-error'
    };
    return map[status] ?? 'badge-secondary';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'Draft': 'Borrador',
      'Pending': 'Pendiente',
      'Sent': 'Enviada',
      'PartialReceived': 'Parcialmente Recibida',
      'PartiallyReceived': 'Parcialmente Recibida',
      'Received': 'Recibida',
      'Cancelled': 'Cancelada'
    };
    return labels[status] ?? status;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  editSupplier(): void {
    const sup = this.supplier();
    if (!sup) return;
    this.router.navigate(['/inventory/suppliers', sup.id, 'edit']);
  }

  getPaymentTermLabel(value: string | undefined): string {
    if (!value) return '—';
    const found = PAYMENT_TERMS.find(t => t.value === value);
    return found ? found.label : value;
  }
}
