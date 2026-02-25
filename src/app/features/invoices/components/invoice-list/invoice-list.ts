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
import { CsvExportService } from '../../../../shared/services/csv-export.service';

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
  private csvExport = inject(CsvExportService);
  private searchSubject = new Subject<string>();

  // State
  invoices = signal<Invoice[]>([]);
  filteredInvoices = signal<Invoice[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Filters
  searchTerm = signal('');
  filterStatus = signal<'all' | InvoiceStatus>('all');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);

  totalPages = computed(() => Math.ceil(this.filteredInvoices().length / this.pageSize()) || 1);

  paginatedInvoices = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredInvoices().slice(start, start + this.pageSize());
  });

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
    { label: 'Facturación', route: '/invoices' },
    { label: 'Facturas' }
  ];

  ngOnInit(): void {
    this.loadInvoices();

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm.set(term);
      this.currentPage.set(1);
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
    this.currentPage.set(1);
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
    const maxVisible = 5;
    const pages: number[] = [];
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    const end = Math.min(total, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  getStatusConfig(status: InvoiceStatus) {
    return INVOICE_STATUS_CONFIG[status] || { label: status, class: 'badge-neutral', icon: 'fa-circle' };
  }

  getProgressPercentage(invoice: Invoice): number {
    if (invoice.totalAmount === 0) return 0;
    return (invoice.paidAmount / invoice.totalAmount) * 100;
  }

  isUnpaid(invoice: Invoice): boolean {
    return invoice.status === InvoiceStatus.Issued && invoice.balance > 0;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }

  exportToCsv(): void {
    this.csvExport.export(this.filteredInvoices(), [
      { header: 'Paciente', accessor: (i) => i.patientName },
      { header: 'Total', accessor: (i) => i.totalAmount },
      { header: 'Pagado', accessor: (i) => i.paidAmount },
      { header: 'Balance', accessor: (i) => i.balance },
      { header: 'Estado', accessor: (i) => INVOICE_STATUS_CONFIG[i.status]?.label || i.status },
      { header: 'Fecha Emisión', accessor: (i) => new Date(i.issuedAt).toLocaleDateString('es-MX') }
    ], 'facturas');
  }
}
