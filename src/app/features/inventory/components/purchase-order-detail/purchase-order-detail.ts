import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { PurchaseOrdersService } from '../../services/purchase-orders.service';
import { PurchaseOrder, PURCHASE_ORDER_STATUS_LABELS, PurchaseOrderStatus } from '../../models/purchase-order.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';

@Component({
  selector: 'app-purchase-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent],
  templateUrl: './purchase-order-detail.html',
  styleUrl: './purchase-order-detail.scss'
})
export class PurchaseOrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private poService = inject(PurchaseOrdersService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);

  order = signal<PurchaseOrder | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

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
        this.error.set('Error al cargar la orden de compra');
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
      Received: 'badge-success',
      Cancelled: 'badge-error'
    };
    return map[status] || 'badge-neutral';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(new Date(date));
  }

  getReceivedPercentage(item: { quantity: number; receivedQuantity: number }): number {
    if (item.quantity === 0) return 0;
    return Math.round((item.receivedQuantity / item.quantity) * 100);
  }

  goBack(): void {
    this.router.navigate(['/inventory/purchase-orders']);
  }
}
