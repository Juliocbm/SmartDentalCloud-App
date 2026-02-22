import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PurchaseOrdersService } from '../../services/purchase-orders.service';
import {
  PurchaseOrder,
  PurchaseOrderItem,
  ReceivePurchaseOrderRequest,
  PURCHASE_ORDER_STATUS_LABELS,
  PurchaseOrderStatus
} from '../../models/purchase-order.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';

interface ReceiveItem {
  id: string;
  productName: string;
  productCode: string;
  unit: string;
  quantity: number;
  receivedSoFar: number;
  pendingQuantity: number;
  receiveNow: number;
}

@Component({
  selector: 'app-purchase-order-receive',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageHeaderComponent],
  templateUrl: './purchase-order-receive.html',
  styleUrls: ['./purchase-order-receive.scss']
})
export class PurchaseOrderReceiveComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private poService = inject(PurchaseOrdersService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);
  private location = inject(Location);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Inventario', route: '/inventory' },
    { label: 'Órdenes de Compra', route: '/inventory/purchase-orders' },
    { label: 'Recibir Mercancía' }
  ];

  order = signal<PurchaseOrder | null>(null);
  receiveItems = signal<ReceiveItem[]>([]);
  loading = signal(true);
  submitting = signal(false);
  error = signal<string | null>(null);

  hasItemsToReceive = computed(() =>
    this.receiveItems().some(item => item.receiveNow > 0)
  );

  totalItemsToReceive = computed(() =>
    this.receiveItems().reduce((sum, item) => sum + item.receiveNow, 0)
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadOrder(id);
    } else {
      this.error.set('ID de orden no proporcionado');
      this.loading.set(false);
    }
  }

  private loadOrder(id: string): void {
    this.loading.set(true);
    this.poService.getById(id).subscribe({
      next: (order) => {
        this.order.set(order);
        this.receiveItems.set(this.buildReceiveItems(order.items));
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading purchase order:', err);
        this.error.set('Error al cargar la orden de compra');
        this.loading.set(false);
      }
    });
  }

  private buildReceiveItems(items: PurchaseOrderItem[]): ReceiveItem[] {
    return items.map(item => {
      const pending = item.quantity - item.receivedQuantity;
      return {
        id: item.id,
        productName: item.productName || '—',
        productCode: item.productCode || '—',
        unit: item.unit || '',
        quantity: item.quantity,
        receivedSoFar: item.receivedQuantity,
        pendingQuantity: pending > 0 ? pending : 0,
        receiveNow: 0
      };
    });
  }

  receiveAll(): void {
    this.receiveItems.update(items =>
      items.map(item => ({ ...item, receiveNow: item.pendingQuantity }))
    );
  }

  clearAll(): void {
    this.receiveItems.update(items =>
      items.map(item => ({ ...item, receiveNow: 0 }))
    );
  }

  onReceiveNowChange(index: number, value: number): void {
    this.receiveItems.update(items => {
      const updated = [...items];
      const item = { ...updated[index] };
      item.receiveNow = Math.max(0, Math.min(value, item.pendingQuantity));
      updated[index] = item;
      return updated;
    });
  }

  async confirmReceive(): Promise<void> {
    const itemsToReceive = this.receiveItems().filter(i => i.receiveNow > 0);
    if (itemsToReceive.length === 0) {
      this.notifications.warning('Ingresa al menos una cantidad a recibir.');
      return;
    }

    const confirmed = await this.notifications.confirm(
      `¿Confirmar la recepción de ${itemsToReceive.length} producto(s)? Esta acción actualizará el inventario.`
    );
    if (!confirmed) return;

    const order = this.order();
    if (!order) return;

    const request: ReceivePurchaseOrderRequest = {
      receivedItems: itemsToReceive.map(item => ({
        id: item.id,
        receivedQuantity: item.receiveNow
      }))
    };

    this.submitting.set(true);
    this.poService.receive(order.id, request).subscribe({
      next: () => {
        this.notifications.success('Mercancía recibida correctamente. El inventario ha sido actualizado.');
        this.router.navigate(['/inventory/purchase-orders', order.id]);
      },
      error: (err) => {
        this.logger.error('Error receiving order:', err);
        this.notifications.error('Error al registrar la recepción.');
        this.submitting.set(false);
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

  goBack(): void {
    this.location.back();
  }
}
