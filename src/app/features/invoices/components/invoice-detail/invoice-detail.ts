import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InvoicesService } from '../../services/invoices.service';
import { Invoice, InvoiceStatus, INVOICE_STATUS_CONFIG, Payment } from '../../models/invoice.models';
import { Cfdi, CfdiSatStatus, CFDI_STATUS_CONFIG, MOTIVO_CANCELACION_OPTIONS } from '../../models/cfdi.models';
import { CfdiService } from '../../services/cfdi.service';
import { ModalService } from '../../../../shared/services/modal.service';
import { PaymentFormModalComponent, PaymentFormModalData } from '../payment-form-modal/payment-form-modal';
import { PaymentsService } from '../../services/payments.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { AuditInfoComponent } from '../../../../shared/components/audit-info/audit-info';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { PatientsService } from '../../../patients/services/patients.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageHeaderComponent, AuditInfoComponent, ModalComponent],
  templateUrl: './invoice-detail.html',
  styleUrl: './invoice-detail.scss'
})
export class InvoiceDetailComponent implements OnInit {
  showAuditModal = signal(false);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private invoicesService = inject(InvoicesService);
  private modalService = inject(ModalService);
  private paymentsService = inject(PaymentsService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);
  private cfdiService = inject(CfdiService);
  private location = inject(Location);
  private patientsService = inject(PatientsService);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Facturas', route: '/invoices' },
    { label: 'Detalle' }
  ];

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
  satStatus = signal<CfdiSatStatus | null>(null);

  // Email Modal State
  showEmailModal = signal(false);
  emailOption = signal<'patient' | 'custom'>('patient');
  customEmail = signal('');
  patientEmail = signal<string | null>(null);
  sendingEmail = signal(false);

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
        this.loadPatientEmail(data.patientId);
      },
      error: (err) => {
        this.logger.error('Error loading invoice:', err);
        this.error.set(getApiErrorMessage(err));
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
    this.location.back();
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
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err, 'Error al cargar datos de facturación electrónica'));
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
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
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
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
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
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
        this.cfdiActionLoading.set(false);
      }
    });
  }

  getCfdiStatusConfig(estado: string) {
    return CFDI_STATUS_CONFIG[estado] || { label: estado, class: 'badge-neutral', icon: 'fa-circle' };
  }

  onDownloadXml(): void {
    const cfdi = this.cfdi();
    if (!cfdi) return;
    this.cfdiService.downloadXml(cfdi.id).subscribe({
      next: (blob) => this.saveFile(blob, `${cfdi.serie || ''}${cfdi.folio || cfdi.id}.xml`, 'application/xml'),
      error: (err) => this.notifications.error(getApiErrorMessage(err))
    });
  }

  onDownloadPdf(): void {
    const cfdi = this.cfdi();
    if (!cfdi) return;
    this.cfdiService.downloadPdf(cfdi.id).subscribe({
      next: (blob) => this.saveFile(blob, `${cfdi.serie || ''}${cfdi.folio || cfdi.id}.pdf`, 'application/pdf'),
      error: (err) => this.notifications.error(getApiErrorMessage(err))
    });
  }

  private saveFile(blob: Blob, filename: string, type: string): void {
    const url = window.URL.createObjectURL(new Blob([blob], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
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

  private loadPatientEmail(patientId: string): void {
    this.patientsService.getById(patientId).subscribe({
      next: (patient) => this.patientEmail.set(patient.email || null),
      error: () => this.patientEmail.set(null)
    });
  }

  openEmailModal(): void {
    if (!this.cfdi() || this.cfdiActionLoading()) return;
    this.emailOption.set(this.patientEmail() ? 'patient' : 'custom');
    this.customEmail.set('');
    this.sendingEmail.set(false);
    this.showEmailModal.set(true);
  }

  closeEmailModal(): void {
    this.showEmailModal.set(false);
  }

  getSelectedEmail(): string {
    return this.emailOption() === 'patient'
      ? (this.patientEmail() ?? '')
      : this.customEmail().trim();
  }

  isEmailValid(): boolean {
    const email = this.getSelectedEmail();
    return !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  confirmSendEmail(): void {
    const cfdi = this.cfdi();
    if (!cfdi || !this.isEmailValid()) return;

    const email = this.getSelectedEmail();
    this.sendingEmail.set(true);
    this.cfdiService.sendEmail(cfdi.id, { email, includeXml: true, includePdf: true }).subscribe({
      next: () => {
        this.notifications.success(`CFDI enviado a ${email}`);
        this.sendingEmail.set(false);
        this.showEmailModal.set(false);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
        this.sendingEmail.set(false);
      }
    });
  }

  consultarSat(): void {
    const cfdi = this.cfdi();
    if (!cfdi || this.cfdiActionLoading()) return;

    this.cfdiActionLoading.set(true);
    this.cfdiService.getStatusSat(cfdi.id).subscribe({
      next: (status) => {
        this.satStatus.set(status);
        this.cfdiActionLoading.set(false);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
        this.cfdiActionLoading.set(false);
      }
    });
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
