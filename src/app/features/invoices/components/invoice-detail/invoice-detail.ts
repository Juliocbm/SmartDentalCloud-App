import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InvoicesService } from '../../services/invoices.service';
import { Invoice, InvoiceStatus, INVOICE_STATUS_CONFIG, Payment } from '../../models/invoice.models';
import { Cfdi, CFDI_STATUS_CONFIG, MOTIVO_CANCELACION_OPTIONS } from '../../models/cfdi.models';
import { CfdiService } from '../../services/cfdi.service';
import { ModalService } from '../../../../shared/services/modal.service';
import { PaymentFormModalComponent, PaymentFormModalData } from '../payment-form-modal/payment-form-modal';
import { PaymentsService } from '../../services/payments.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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
  private cfdiService = inject(CfdiService);

  // State
  invoice = signal<Invoice | null>(null);
  payments = signal<Payment[]>([]);
  loading = signal(false);
  loadingPayments = signal(false);
  error = signal<string | null>(null);

  // CFDI State
  cfdi = signal<Cfdi | null>(null);
  cfdiLoading = signal(false);
  cfdiActionLoading = signal(false);
  showCancelForm = signal(false);
  cancelMotivo = signal('');
  cancelObservaciones = signal('');

  // Constants
  InvoiceStatus = InvoiceStatus;
  INVOICE_STATUS_CONFIG = INVOICE_STATUS_CONFIG;
  CFDI_STATUS_CONFIG = CFDI_STATUS_CONFIG;
  MOTIVO_CANCELACION_OPTIONS = MOTIVO_CANCELACION_OPTIONS;

  ngOnInit(): void {
    const invoiceId = this.route.snapshot.paramMap.get('id');
    if (invoiceId) {
      this.loadInvoice(invoiceId);
      this.loadPayments(invoiceId);
      this.loadCfdi(invoiceId);
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

  // === CFDI ===

  private loadCfdi(invoiceId: string): void {
    this.cfdiLoading.set(true);
    this.cfdiService.getByInvoice(invoiceId).subscribe({
      next: (cfdis) => {
        const active = cfdis.find(c => c.estado !== 'Cancelado') || cfdis[0] || null;
        this.cfdi.set(active);
        this.cfdiLoading.set(false);
      },
      error: () => {
        this.cfdiLoading.set(false);
      }
    });
  }

  generateCfdi(): void {
    const inv = this.invoice();
    if (!inv || this.cfdiActionLoading()) return;

    this.cfdiActionLoading.set(true);
    this.cfdiService.generate({
      invoiceId: inv.id,
      usoCfdi: inv.usoCFDI || 'D01',
      metodoPago: inv.metodoPago || 'PUE',
      formaPago: inv.formaPago || undefined
    }).subscribe({
      next: (result) => {
        if (result.esValido) {
          this.notifications.success('CFDI generado exitosamente');
          this.loadCfdi(inv.id);
        } else {
          this.notifications.error('Error de validación: ' + result.erroresValidacion.join(', '));
        }
        this.cfdiActionLoading.set(false);
      },
      error: () => {
        this.notifications.error('Error al generar el CFDI');
        this.cfdiActionLoading.set(false);
      }
    });
  }

  timbrarCfdi(): void {
    const cfdi = this.cfdi();
    const inv = this.invoice();
    if (!cfdi || !inv || this.cfdiActionLoading()) return;

    this.cfdiActionLoading.set(true);
    this.cfdiService.timbrar(cfdi.id).subscribe({
      next: (result) => {
        if (result.exitoso) {
          this.notifications.success('CFDI timbrado exitosamente. UUID: ' + result.uuid);
          this.loadCfdi(inv.id);
          this.loadInvoice(inv.id);
        } else {
          this.notifications.error('Error al timbrar: ' + (result.mensajeError || 'Error desconocido'));
        }
        this.cfdiActionLoading.set(false);
      },
      error: () => {
        this.notifications.error('Error al timbrar el CFDI');
        this.cfdiActionLoading.set(false);
      }
    });
  }

  toggleCancelForm(): void {
    this.showCancelForm.update(v => !v);
    if (this.showCancelForm()) {
      this.cancelMotivo.set('');
      this.cancelObservaciones.set('');
    }
  }

  cancelarCfdi(): void {
    const cfdi = this.cfdi();
    const inv = this.invoice();
    if (!cfdi || !inv || !this.cancelMotivo() || this.cfdiActionLoading()) return;

    this.cfdiActionLoading.set(true);
    this.cfdiService.cancelar(cfdi.id, {
      motivoCancelacion: this.cancelMotivo(),
      observaciones: this.cancelObservaciones().trim() || undefined
    }).subscribe({
      next: (result) => {
        if (result.exitoso) {
          this.notifications.success('CFDI cancelado exitosamente');
          this.showCancelForm.set(false);
          this.loadCfdi(inv.id);
        } else {
          this.notifications.error('Error al cancelar: ' + (result.mensajeError || 'Error desconocido'));
        }
        this.cfdiActionLoading.set(false);
      },
      error: () => {
        this.notifications.error('Error al cancelar el CFDI');
        this.cfdiActionLoading.set(false);
      }
    });
  }

  getCfdiStatusConfig(estado: string) {
    return CFDI_STATUS_CONFIG[estado] || { label: estado, class: 'badge-neutral', icon: 'fa-circle' };
  }

  getXmlUrl(): string {
    const cfdi = this.cfdi();
    return cfdi ? this.cfdiService.downloadXml(cfdi.id) : '';
  }

  getPdfUrl(): string {
    const cfdi = this.cfdi();
    return cfdi ? this.cfdiService.downloadPdf(cfdi.id) : '';
  }

  canGenerateCfdi(): boolean {
    const inv = this.invoice();
    const cfdi = this.cfdi();
    return !!inv && inv.status !== InvoiceStatus.Cancelled && !cfdi;
  }

  canTimbrarCfdi(): boolean {
    const cfdi = this.cfdi();
    return !!cfdi && cfdi.estado === 'PendienteTimbrado';
  }

  canCancelarCfdi(): boolean {
    const cfdi = this.cfdi();
    return !!cfdi && cfdi.estado === 'Timbrado';
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
