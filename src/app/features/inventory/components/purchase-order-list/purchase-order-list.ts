import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { PurchaseOrdersService } from '../../services/purchase-orders.service';
import { PurchaseOrder, PurchaseOrderStatus, PURCHASE_ORDER_STATUS_LABELS } from '../../models/purchase-order.models';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-purchase-order-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageHeaderComponent],
  templateUrl: './purchase-order-list.html',
  styleUrls: ['./purchase-order-list.scss']
})
export class PurchaseOrderListComponent implements OnInit, OnDestroy {
  private purchaseOrdersService = inject(PurchaseOrdersService);
  private searchSubject = new Subject<string>();

  orders = signal<PurchaseOrder[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  searchTerm = signal('');
  filterStatus = signal<'all' | PurchaseOrderStatus>('all');

  statusLabels = PURCHASE_ORDER_STATUS_LABELS;

  breadcrumbItems = signal<BreadcrumbItem[]>([
    { label: 'Inicio', route: '/dashboard', icon: 'fa-home' },
    { label: 'Inventario', route: '/inventory', icon: 'fa-boxes-stacked' },
    { label: 'Órdenes de Compra', route: '/inventory/purchase-orders', icon: 'fa-file-invoice' }
  ]);

  filteredOrders = computed(() => {
    let result = this.orders();

    const search = this.searchTerm().toLowerCase().trim();
    if (search) {
      result = result.filter(o =>
        o.orderNumber.toLowerCase().includes(search) ||
        o.supplierName.toLowerCase().includes(search)
      );
    }

    const status = this.filterStatus();
    if (status !== 'all') {
      result = result.filter(o => o.status === status);
    }

    return result;
  });

  ngOnInit(): void {
    this.loadData();
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm.set(term);
    });
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.purchaseOrdersService.getAll().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading purchase orders:', err);
        this.error.set('Error al cargar órdenes de compra. Por favor, intenta de nuevo.');
        this.loading.set(false);
      }
    });
  }

  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  onStatusFilterChange(status: 'all' | PurchaseOrderStatus): void {
    this.filterStatus.set(status);
  }

  getStatusClass(status: PurchaseOrderStatus): string {
    const classes: Record<PurchaseOrderStatus, string> = {
      Draft: 'badge-warning',
      Sent: 'badge-info',
      Received: 'badge-success',
      Cancelled: 'badge-error'
    };
    return classes[status] || '';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(new Date(date));
  }
}
