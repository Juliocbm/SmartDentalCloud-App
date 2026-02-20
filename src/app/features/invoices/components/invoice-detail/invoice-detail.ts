import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InvoicesService } from '../../services/invoices.service';
import { Invoice, InvoiceStatus, INVOICE_STATUS_CONFIG, Payment } from '../../models/invoice.models';
import { ModalService } from '../../../../shared/services/modal.service';
import { PaymentFormModalComponent, PaymentFormModalData } from '../payment-form-modal/payment-form-modal';
import { PaymentsService } from '../../services/payments.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './invoice-detail.html',
  styleUrl: './invoice-detail.scss'
})
export class InvoiceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private invoicesService = inject(InvoicesService);
  private modalService = inject(ModalService);
  private paymentsService = inject(PaymentsService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);

  // State
  invoice = signal<Invoice | null>(null);
  payments = signal<Payment[]>([]);
  loading = signal(false);
  loadingPayments = signal(false);
  error = signal<string | null>(null);

  // Constants
  InvoiceStatus = InvoiceStatus;
  INVOICE_STATUS_CONFIG = INVOICE_STATUS_CONFIG;

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

    this.paymentsService.getByInvoice(invoiceId).subscribe({
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

  openPaymentModal(): void {
    const inv = this.invoice();
    if (!inv || inv.balance <= 0) return;

    const ref = this.modalService.open<PaymentFormModalData, Payment>(
      PaymentFormModalComponent,
      {
        data: {
          invoiceId: inv.id,
          balance: inv.balance,
          patientName: inv.patientName
        }
      }
    );

    ref.afterClosed().subscribe(payment => {
      if (payment) {
        this.loadInvoice(inv.id);
        this.loadPayments(inv.id);
      }
    });
  }

  canRegisterPayment(): boolean {
    const inv = this.invoice();
    return !!inv && inv.balance > 0 && inv.status !== InvoiceStatus.Cancelled;
  }

  formatDate(date: Date | string): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  }

  formatDateTime(date: Date | string): string {
    if (!date) return '—';
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
