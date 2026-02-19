import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { InvoicesService } from '../../services/invoices.service';
import { Invoice, InvoiceStatus, INVOICE_STATUS_CONFIG } from '../../models/invoice.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent],
  templateUrl: './invoice-detail.html',
  styleUrl: './invoice-detail.scss'
})
export class InvoiceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private invoicesService = inject(InvoicesService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);

  // State
  invoice = signal<Invoice | null>(null);
  payments = signal<any[]>([]);
  loading = signal(false);
  loadingPayments = signal(false);
  error = signal<string | null>(null);

  // Constants
  InvoiceStatus = InvoiceStatus;
  INVOICE_STATUS_CONFIG = INVOICE_STATUS_CONFIG;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Facturas', route: '/invoices' },
    { label: 'Detalle' }
  ];

  ngOnInit(): void {
    const invoiceId = this.route.snapshot.paramMap.get('id');
    if (invoiceId) {
      this.loadInvoice(invoiceId);
      this.loadPayments(invoiceId);
    }
  }

  private loadInvoice(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.invoicesService.getById(id).subscribe({
      next: (data) => {
        this.invoice.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading invoice:', err);
        this.error.set('Error al cargar la factura. Por favor intente nuevamente.');
        this.loading.set(false);
      }
    });
  }

  private loadPayments(invoiceId: string): void {
    this.loadingPayments.set(true);

    this.invoicesService.getInvoicePayments(invoiceId).subscribe({
      next: (data) => {
        this.payments.set(data);
        this.loadingPayments.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading payments:', err);
        this.loadingPayments.set(false);
      }
    });
  }

  getStatusConfig(status: InvoiceStatus) {
    return INVOICE_STATUS_CONFIG[status] || { label: status, class: 'badge-neutral', icon: 'fa-circle' };
  }

  getPaymentPercentage(): number {
    const inv = this.invoice();
    if (!inv || inv.totalAmount === 0) return 0;
    return (inv.paidAmount / inv.totalAmount) * 100;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }

  goBack(): void {
    this.router.navigate(['/invoices']);
  }

  printInvoice(): void {
    window.print();
  }
}
