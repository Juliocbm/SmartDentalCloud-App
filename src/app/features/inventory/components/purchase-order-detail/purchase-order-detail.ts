import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { AuditInfoComponent } from '../../../../shared/components/audit-info/audit-info';
import { PurchaseOrdersService } from '../../services/purchase-orders.service';
import { PurchaseOrder, PURCHASE_ORDER_STATUS_LABELS, PurchaseOrderStatus } from '../../models/purchase-order.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { PermissionService, PERMISSIONS } from '../../../../core/services/permission.service';
import { DateFormatService } from '../../../../core/services/date-format.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-purchase-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent, AuditInfoComponent, EmptyStateComponent],
  templateUrl: './purchase-order-detail.html',
  styleUrl: './purchase-order-detail.scss'
})
export class PurchaseOrderDetailComponent implements OnInit {
  showAuditModal = signal(false);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private poService = inject(PurchaseOrdersService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);
  private location = inject(Location);
  permissionService = inject(PermissionService);

  order = signal<PurchaseOrder | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  activeTab = signal<'info' | 'items'>('info');

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Inventario', route: '/inventory' },
    { label: 'Órdenes de Compra', route: '/inventory/purchase-orders' },
    { label: 'Detalle' }
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadOrder(id);
  }

  private loadOrder(id: string): void {
    this.loading.set(true);
    this.poService.getById(id).subscribe({
      next: (data) => {
        this.order.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading purchase order:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  getStatusLabel(status: PurchaseOrderStatus): string {
    return PURCHASE_ORDER_STATUS_LABELS[status] || status;
  }

  getStatusClass(status: PurchaseOrderStatus): string {
    const map: Record<string, string> = {
      Draft: 'badge-neutral',
      Sent: 'badge-info',
      PartialReceived: 'badge-info',
      Received: 'badge-success',
      Cancelled: 'badge-error'
    };
    return map[status] || 'badge-neutral';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  formatDate(date: Date | string | undefined): string {
    return DateFormatService.shortDate(date);
  }

  getReceivedPercentage(item: { quantity: number; receivedQuantity: number }): number {
    if (item.quantity === 0) return 0;
    return Math.round((item.receivedQuantity / item.quantity) * 100);
  }

  setActiveTab(tab: 'info' | 'items'): void {
    this.activeTab.set(tab);
  }

  goBack(): void {
    this.location.back();
  }
}
