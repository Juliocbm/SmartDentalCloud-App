import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { PaymentsService } from '../../services/payments.service';
import { Payment, PaymentMethod, PAYMENT_METHOD_CONFIG, PAYMENT_METHOD_BADGE_CONFIG } from '../../models/payment.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { PermissionService, PERMISSIONS } from '../../../../core/services/permission.service';
import { DateFormatService } from '../../../../core/services/date-format.service';

export type SortField = 'paidAt' | 'amount' | 'paymentMethod' | 'patientName';
export type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageHeaderComponent],
  templateUrl: './payment-list.html',
  styleUrl: './payment-list.scss'
})
export class PaymentListComponent implements OnInit, OnDestroy {
  permissionService = inject(PermissionService);
  PERMISSIONS = PERMISSIONS;
  private paymentsService = inject(PaymentsService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);
  private searchSubject = new Subject<string>();

  // State
  payments = signal<Payment[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Filters
  searchTerm = signal('');
  filterMethod = signal<'all' | PaymentMethod>('all');
  startDate = signal('');
  endDate = signal('');

  // Sorting
  sortField = signal<SortField>('paidAt');
  sortDirection = signal<SortDirection>('desc');

  // Pagination
  currentPage = signal(1);
  readonly pageSize = signal(10);

  // Derived: filtered + sorted + paginated
  filteredPayments = computed(() => {
    let filtered = [...this.payments()];

    // Filtro por método de pago
    const method = this.filterMethod();
    if (method !== 'all') {
      filtered = filtered.filter(p => p.paymentMethod === method);
    }

    // Filtro por búsqueda (referencia, monto, método, paciente, nº factura)
    const search = this.searchTerm().toLowerCase().trim();
    if (search) {
      filtered = filtered.filter(p =>
        p.reference?.toLowerCase().includes(search) ||
        this.formatCurrency(p.amount).toLowerCase().includes(search) ||
        this.getMethodConfig(p.paymentMethod).label.toLowerCase().includes(search) ||
        p.patientName?.toLowerCase().includes(search) ||
        p.invoiceNumber?.toLowerCase().includes(search)
      );
    }

    // Filtro por rango de fechas
    const start = this.startDate();
    if (start) {
      const startMs = new Date(start).setHours(0, 0, 0, 0);
      filtered = filtered.filter(p => new Date(p.paidAt).getTime() >= startMs);
    }
    const end = this.endDate();
    if (end) {
      const endMs = new Date(end).setHours(23, 59, 59, 999);
      filtered = filtered.filter(p => new Date(p.paidAt).getTime() <= endMs);
    }

    // Ordenamiento
    const field = this.sortField();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;

    filtered.sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      switch (field) {
        case 'paidAt':
          valA = new Date(a.paidAt).getTime();
          valB = new Date(b.paidAt).getTime();
          break;
        case 'amount':
          valA = a.amount;
          valB = b.amount;
          break;
        case 'paymentMethod':
          valA = this.getMethodConfig(a.paymentMethod).label;
          valB = this.getMethodConfig(b.paymentMethod).label;
          break;
        case 'patientName':
          valA = a.patientName ?? '';
          valB = b.patientName ?? '';
          break;
        default:
          valA = new Date(a.paidAt).getTime();
          valB = new Date(b.paidAt).getTime();
      }

      if (valA < valB) return -1 * dir;
      if (valA > valB) return 1 * dir;
      return 0;
    });

    return filtered;
  });

  totalPages = computed(() => Math.ceil(this.filteredPayments().length / this.pageSize()));

  paginatedPayments = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredPayments().slice(start, start + this.pageSize());
  });

  hasActiveFilters = computed(() =>
    this.searchTerm() !== '' ||
    this.filterMethod() !== 'all' ||
    this.startDate() !== '' ||
    this.endDate() !== ''
  );

  // Constants
  paymentMethods = Object.values(PaymentMethod);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Pagos' }
  ];

  ngOnInit(): void {
    this.loadPayments();

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm.set(term);
      this.currentPage.set(1);
    });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  loadPayments(): void {
    this.loading.set(true);
    this.error.set(null);

    this.paymentsService.getAll().subscribe({
      next: (data) => {
        const parsed = data.map(p => ({
          ...p,
          paidAt: new Date(p.paidAt),
          createdAt: new Date(p.createdAt)
        }));
        this.payments.set(parsed);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading payments:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  onMethodFilterChange(value: string): void {
    this.filterMethod.set(value as 'all' | PaymentMethod);
    this.currentPage.set(1);
  }

  onStartDateChange(value: string): void {
    this.startDate.set(value);
    this.currentPage.set(1);
  }

  onEndDateChange(value: string): void {
    this.endDate.set(value);
    this.currentPage.set(1);
  }

  onSortChange(field: SortField): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.filterMethod.set('all');
    this.startDate.set('');
    this.endDate.set('');
    this.currentPage.set(1);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  getPaginationPages(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 3) {
        pages.push(1, 2, 3, 4, 5);
      } else if (current >= total - 2) {
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        for (let i = current - 2; i <= current + 2; i++) pages.push(i);
      }
    }
    return pages;
  }

  getSortIcon(field: SortField): string {
    if (this.sortField() !== field) return 'fa-sort';
    return this.sortDirection() === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  getMethodConfig(method: string) {
    return PAYMENT_METHOD_CONFIG[method as PaymentMethod] || PAYMENT_METHOD_CONFIG[PaymentMethod.Other];
  }

  getMethodBadgeConfig(method: string) {
    return PAYMENT_METHOD_BADGE_CONFIG[method as PaymentMethod] || PAYMENT_METHOD_BADGE_CONFIG[PaymentMethod.Other];
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  formatDate(date: Date): string {
    return DateFormatService.dateTime(date);
  }
}
