import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { InvoicesService } from '../../services/invoices.service';
import { Invoice, InvoiceStatus, INVOICE_STATUS_CONFIG } from '../../models/invoice.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageHeaderComponent],
  templateUrl: './invoice-list.html',
  styleUrl: './invoice-list.scss'
})
export class InvoiceListComponent implements OnInit, OnDestroy {
  private invoicesService = inject(InvoicesService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);
  private searchSubject = new Subject<string>();

  // State
  invoices = signal<Invoice[]>([]);
  filteredInvoices = signal<Invoice[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Filters
  searchTerm = signal('');
  filterStatus = signal<'all' | InvoiceStatus>('all');

  // Computed
  totals = computed(() => {
    return this.invoicesService.calculateTotals(this.filteredInvoices());
  });

  // Constants
  statusOptions = Object.values(InvoiceStatus);
  InvoiceStatus = InvoiceStatus;
  INVOICE_STATUS_CONFIG = INVOICE_STATUS_CONFIG;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Facturas' }
  ];

  ngOnInit(): void {
    this.loadInvoices();

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

  loadInvoices(): void {
    this.loading.set(true);
    this.error.set(null);

    this.invoicesService.getAll().subscribe({
      next: (data) => {
        this.invoices.set(data);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading invoices:', err);
        this.error.set('Error al cargar facturas. Por favor intente nuevamente.');
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.invoices()];

    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(inv =>
        inv.patientName.toLowerCase().includes(search) ||
        inv.folio?.toLowerCase().includes(search) ||
        inv.serie?.toLowerCase().includes(search)
      );
    }

    const status = this.filterStatus();
    if (status !== 'all') {
      filtered = filtered.filter(inv => inv.status === status);
    }

    this.filteredInvoices.set(filtered);
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  onStatusFilterChange(value: string): void {
    this.filterStatus.set(value as 'all' | InvoiceStatus);
    this.applyFilters();
  }

  getStatusConfig(status: InvoiceStatus) {
    return INVOICE_STATUS_CONFIG[status] || { label: status, class: 'badge-neutral', icon: 'fa-circle' };
  }

  getProgressPercentage(invoice: Invoice): number {
    if (invoice.totalAmount === 0) return 0;
    return (invoice.paidAmount / invoice.totalAmount) * 100;
  }

  isOverdue(invoice: Invoice): boolean {
    return invoice.status === InvoiceStatus.Overdue;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }
}
