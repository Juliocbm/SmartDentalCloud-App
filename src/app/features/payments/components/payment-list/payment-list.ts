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

  // Computed
  totalAmount = computed(() => {
    return this.paymentsService.calculateTotal(this.filteredPayments());
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
        this.payments.set(data);
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

    this.filteredPayments.set(filtered);
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  onMethodFilterChange(value: string): void {
    this.filterMethod.set(value as 'all' | PaymentMethod);
    this.applyFilters();
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
}
