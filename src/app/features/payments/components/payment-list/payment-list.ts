import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { PaymentsService } from '../../services/payments.service';
import { Payment, PaymentMethod, PAYMENT_METHOD_CONFIG, PaymentFilters } from '../../models/payment.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageHeaderComponent],
  templateUrl: './payment-list.html',
  styleUrl: './payment-list.scss'
})
export class PaymentListComponent implements OnInit, OnDestroy {
  private paymentsService = inject(PaymentsService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);
  private searchSubject = new Subject<string>();

  // State
  payments = signal<Payment[]>([]);
  filteredPayments = signal<Payment[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Filters
  searchTerm = signal('');
  filterMethod = signal<'all' | PaymentMethod>('all');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(15);

  // Computed
  totalAmount = computed(() => {
    return this.paymentsService.calculateTotal(this.filteredPayments());
  });

  totalPages = computed(() => Math.ceil(this.filteredPayments().length / this.pageSize()));

  paginatedPayments = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredPayments().slice(start, start + this.pageSize());
  });

  // Constants
  paymentMethods = Object.values(PaymentMethod);
  PAYMENT_METHOD_CONFIG = PAYMENT_METHOD_CONFIG;

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
      this.applyFilters();
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
        // Parse dates from API strings
        const parsed = data.map(p => ({
          ...p,
          paidAt: new Date(p.paidAt),
          createdAt: new Date(p.createdAt)
        }));
        this.payments.set(parsed);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading payments:', err);
        this.error.set('Error al cargar pagos. Por favor intente nuevamente.');
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.payments()];

    const method = this.filterMethod();
    if (method !== 'all') {
      filtered = filtered.filter(p => p.paymentMethod === method);
    }

    const search = this.searchTerm().toLowerCase().trim();
    if (search) {
      filtered = filtered.filter(p =>
        p.reference?.toLowerCase().includes(search) ||
        this.formatCurrency(p.amount).toLowerCase().includes(search) ||
        this.getMethodConfig(p.paymentMethod).label.toLowerCase().includes(search)
      );
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());

    this.filteredPayments.set(filtered);
    this.currentPage.set(1);
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  onMethodFilterChange(value: string): void {
    this.filterMethod.set(value as 'all' | PaymentMethod);
    this.applyFilters();
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

  getMethodConfig(method: string) {
    return PAYMENT_METHOD_CONFIG[method as PaymentMethod] || PAYMENT_METHOD_CONFIG[PaymentMethod.Other];
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(date));
  }
}
