import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { SendEmailModalComponent } from '../../../../shared/components/send-email-modal/send-email-modal';
import { InvoicesService } from '../../services/invoices.service';
import { PatientsService } from '../../../patients/services/patients.service';
import { Invoice, InvoiceStatus, INVOICE_STATUS_CONFIG } from '../../models/invoice.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { CsvExportService } from '../../../../shared/services/csv-export.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageHeaderComponent, SendEmailModalComponent],
  templateUrl: './invoice-list.html',
  styleUrl: './invoice-list.scss'
})
export class InvoiceListComponent implements OnInit, OnDestroy {
  private invoicesService = inject(InvoicesService);
  private patientsService = inject(PatientsService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);
  private csvExport = inject(CsvExportService);
  private searchSubject = new Subject<string>();

  // State
  invoices = signal<Invoice[]>([]);
  filteredInvoices = signal<Invoice[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // PDF & Email
  printLoadingId = signal<string | null>(null);
  showEmailModal = signal(false);
  emailModalInvoice = signal<Invoice | null>(null);
  sendingEmail = signal(false);
  patientEmail = signal<string | null>(null);

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
        this.error.set(getApiErrorMessage(err));
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

  // === PDF & Email ===

  onPrintFromList(invoice: Invoice): void {
    if (this.printLoadingId()) return;
    this.printLoadingId.set(invoice.id);
    this.invoicesService.downloadPdf(invoice.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        window.URL.revokeObjectURL(url);
        this.printLoadingId.set(null);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err, 'Error al generar PDF'));
        this.printLoadingId.set(null);
      }
    });
  }

  openEmailFromList(invoice: Invoice): void {
    this.emailModalInvoice.set(invoice);
    this.patientEmail.set(null);
    this.sendingEmail.set(false);
    this.showEmailModal.set(true);
    this.patientsService.getById(invoice.patientId).subscribe({
      next: (patient) => this.patientEmail.set(patient.email || null),
      error: () => this.patientEmail.set(null)
    });
  }

  closeEmailModal(): void {
    this.showEmailModal.set(false);
    this.emailModalInvoice.set(null);
  }

  onSendEmail(email: string): void {
    const invoice = this.emailModalInvoice();
    if (!invoice) return;

    this.sendingEmail.set(true);
    this.invoicesService.sendEmail(invoice.id, email).subscribe({
      next: () => {
        const label = invoice.cfdiUUID ? 'CFDI' : 'Factura';
        this.notifications.success(`${label} enviada a ${email}`);
        this.sendingEmail.set(false);
        this.showEmailModal.set(false);
        this.emailModalInvoice.set(null);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
        this.sendingEmail.set(false);
      }
    });
  }
}
