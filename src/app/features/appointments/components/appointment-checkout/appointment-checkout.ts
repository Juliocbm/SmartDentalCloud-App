import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { AppointmentsService } from '../../services/appointments.service';
import { Appointment, AppointmentStatus, AppointmentStatusConfig } from '../../models/appointment.models';
import { TreatmentsService } from '../../../treatments/services/treatments.service';
import { UnbilledTreatment } from '../../../treatments/models/treatment.models';
import { InvoicesService } from '../../../invoices/services/invoices.service';
import {
  CreateInvoiceRequest,
  CreateInvoiceItemRequest,
  CreatePaymentRequest,
  Invoice,
  CFDI_USO_OPTIONS,
  CFDI_METODO_PAGO_OPTIONS,
  CFDI_FORMA_PAGO_OPTIONS,
  PAYMENT_METHOD_OPTIONS
} from '../../../invoices/models/invoice.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { DateFormatService } from '../../../../core/services/date-format.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';

export type CheckoutStep = 'summary' | 'billing' | 'payment' | 'confirm';

@Component({
  selector: 'app-appointment-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageHeaderComponent, EmptyStateComponent],
  templateUrl: './appointment-checkout.html',
  styleUrl: './appointment-checkout.scss'
})
export class AppointmentCheckoutComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private appointmentsService = inject(AppointmentsService);
  private treatmentsService = inject(TreatmentsService);
  private invoicesService = inject(InvoicesService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);

  // State
  appointment = signal<Appointment | null>(null);
  treatments = signal<UnbilledTreatment[]>([]);
  selectedTreatmentIds = signal<Set<string>>(new Set());
  loading = signal(true);
  treatmentsLoading = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);

  // Wizard step
  currentStep = signal<CheckoutStep>('summary');
  steps: CheckoutStep[] = ['summary', 'billing', 'payment', 'confirm'];

  // Billing config
  generateInvoice = signal(true);
  usoCFDI = signal('G03');
  metodoPago = signal('PUE');
  formaPago = signal('01');
  taxRate = signal(16);

  // Payment config
  registerPayment = signal(true);
  paymentMethod = signal('cash');
  paymentReference = signal('');

  // Result
  createdInvoice = signal<Invoice | null>(null);

  // Constants
  cfdiUsoOptions = CFDI_USO_OPTIONS;
  cfdiMetodoPagoOptions = CFDI_METODO_PAGO_OPTIONS;
  cfdiFormaPagoOptions = CFDI_FORMA_PAGO_OPTIONS;
  paymentMethodOptions = PAYMENT_METHOD_OPTIONS;
  statusConfig = AppointmentStatusConfig;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Citas', route: '/appointments' },
    { label: 'Checkout' }
  ];

  // Computed
  selectedTreatments = computed(() => {
    const ids = this.selectedTreatmentIds();
    return this.treatments().filter(t => ids.has(t.id));
  });

  subtotal = computed(() =>
    this.selectedTreatments().reduce((sum, t) => sum + t.cost, 0)
  );

  taxAmount = computed(() =>
    this.subtotal() * (this.taxRate() / 100)
  );

  total = computed(() =>
    this.subtotal() + this.taxAmount()
  );

  allSelected = computed(() => {
    const treatments = this.treatments();
    return treatments.length > 0 && this.selectedTreatmentIds().size === treatments.length;
  });

  currentStepIndex = computed(() =>
    this.steps.indexOf(this.currentStep())
  );

  canGoNext = computed(() => {
    const step = this.currentStep();
    if (step === 'summary') return this.selectedTreatmentIds().size > 0 || !this.generateInvoice();
    if (step === 'billing') return true;
    if (step === 'payment') return true;
    return false;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadAppointment(id);
    } else {
      this.error.set('ID de cita no válido');
      this.loading.set(false);
    }
  }

  private loadAppointment(id: string): void {
    this.loading.set(true);
    this.appointmentsService.getById(id).subscribe({
      next: (apt) => {
        this.appointment.set(apt);
        this.loading.set(false);
        this.loadTreatments(apt.patientId, apt.id);
      },
      error: (err) => {
        this.logger.error('Error loading appointment for checkout:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  private loadTreatments(patientId: string, appointmentId: string): void {
    this.treatmentsLoading.set(true);
    this.treatmentsService.getUnbilledByPatient(patientId, appointmentId).subscribe({
      next: (data) => {
        this.treatments.set(data);
        // Auto-select all
        this.selectedTreatmentIds.set(new Set(data.map(t => t.id)));
        this.treatmentsLoading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading unbilled treatments:', err);
        this.treatmentsLoading.set(false);
      }
    });
  }

  // === Selection ===

  toggleTreatment(id: string): void {
    const current = new Set(this.selectedTreatmentIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.selectedTreatmentIds.set(current);
  }

  toggleAll(): void {
    if (this.allSelected()) {
      this.selectedTreatmentIds.set(new Set());
    } else {
      this.selectedTreatmentIds.set(new Set(this.treatments().map(t => t.id)));
    }
  }

  isSelected(id: string): boolean {
    return this.selectedTreatmentIds().has(id);
  }

  // === Navigation ===

  goToStep(step: CheckoutStep): void {
    const targetIdx = this.steps.indexOf(step);
    const currentIdx = this.currentStepIndex();
    // Only allow going back or to the next step
    if (targetIdx <= currentIdx) {
      this.currentStep.set(step);
    }
  }

  nextStep(): void {
    const idx = this.currentStepIndex();
    if (idx < this.steps.length - 1) {
      // Skip billing step if not generating invoice
      if (this.currentStep() === 'summary' && !this.generateInvoice()) {
        this.currentStep.set('confirm');
        return;
      }
      // Skip payment step if not generating invoice
      if (this.currentStep() === 'billing' && !this.generateInvoice()) {
        this.currentStep.set('confirm');
        return;
      }
      this.currentStep.set(this.steps[idx + 1]);
    }
  }

  prevStep(): void {
    const idx = this.currentStepIndex();
    if (idx > 0) {
      // Skip back over payment/billing if not generating invoice
      if (this.currentStep() === 'confirm' && !this.generateInvoice()) {
        this.currentStep.set('summary');
        return;
      }
      this.currentStep.set(this.steps[idx - 1]);
    }
  }

  // === Quick complete (skip billing) ===

  onSkipBilling(): void {
    this.generateInvoice.set(false);
    this.currentStep.set('confirm');
  }

  // === Submit ===

  async onSubmit(): Promise<void> {
    const apt = this.appointment();
    if (!apt || this.submitting()) return;

    this.submitting.set(true);
    this.error.set(null);

    try {
      // Step 1: Complete appointment
      await this.completeAppointment(apt.id);

      // Step 2: Create invoice (if selected)
      if (this.generateInvoice() && this.selectedTreatments().length > 0) {
        const invoice = await this.createInvoice(apt);

        // Step 3: Register payment (if selected)
        if (this.registerPayment() && invoice) {
          await this.createPayment(invoice);
        }
      }

      this.submitting.set(false);
      this.notifications.success('Checkout completado exitosamente.');

      // Navigate to the created invoice or back to appointment
      const invoice = this.createdInvoice();
      if (invoice) {
        this.router.navigate(['/invoices', invoice.id]);
      } else {
        this.router.navigate(['/appointments', apt.id]);
      }
    } catch (err: any) {
      this.logger.error('Checkout error:', err);
      this.notifications.error(getApiErrorMessage(err));
      this.submitting.set(false);
    }
  }

  private completeAppointment(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.appointmentsService.complete(id).subscribe({
        next: () => resolve(),
        error: (err) => reject(err)
      });
    });
  }

  private createInvoice(apt: Appointment): Promise<Invoice> {
    const items: CreateInvoiceItemRequest[] = this.selectedTreatments().map(t => ({
      treatmentId: t.id,
      appointmentId: t.appointmentId || apt.id,
      treatmentPlanItemId: t.treatmentPlanItemId || undefined,
      description: t.serviceName || 'Tratamiento',
      quantity: 1,
      unitPrice: t.cost,
      discountPercentage: 0,
      taxRate: this.taxRate(),
      claveProdServ: t.claveProdServ || '85122001',
      claveUnidad: t.claveUnidad || 'E48'
    }));

    const request: CreateInvoiceRequest = {
      patientId: apt.patientId,
      usoCFDI: this.usoCFDI(),
      metodoPago: this.metodoPago(),
      formaPago: this.formaPago(),
      items
    };

    return new Promise((resolve, reject) => {
      this.invoicesService.create(request).subscribe({
        next: (invoice) => {
          this.createdInvoice.set(invoice);
          resolve(invoice);
        },
        error: (err) => reject(err)
      });
    });
  }

  private createPayment(invoice: Invoice): Promise<void> {
    const request: CreatePaymentRequest = {
      invoiceId: invoice.id,
      amount: invoice.totalAmount,
      paymentMethod: this.paymentMethod(),
      paidAt: new Date().toISOString(),
      reference: this.paymentReference() || undefined
    };

    return new Promise((resolve, reject) => {
      this.invoicesService.createPayment(request).subscribe({
        next: () => resolve(),
        error: (err) => reject(err)
      });
    });
  }

  // === Formatting ===

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }

  formatDate(date: Date | string): string {
    return DateFormatService.longDate(date);
  }

  formatTime(date: Date | string): string {
    return DateFormatService.timeOnly(date);
  }

  getStepLabel(step: CheckoutStep): string {
    const labels: Record<CheckoutStep, string> = {
      summary: 'Tratamientos',
      billing: 'Facturación',
      payment: 'Pago',
      confirm: 'Confirmar'
    };
    return labels[step];
  }

  getStepIcon(step: CheckoutStep): string {
    const icons: Record<CheckoutStep, string> = {
      summary: 'fa-tooth',
      billing: 'fa-file-invoice-dollar',
      payment: 'fa-credit-card',
      confirm: 'fa-check-circle'
    };
    return icons[step];
  }

  isStepCompleted(step: CheckoutStep): boolean {
    return this.steps.indexOf(step) < this.currentStepIndex();
  }

  isStepActive(step: CheckoutStep): boolean {
    return step === this.currentStep();
  }

  getPaymentMethodLabel(value: string): string {
    return this.paymentMethodOptions.find(o => o.value === value)?.label || value;
  }

  getPaymentMethodIcon(value: string): string {
    return this.paymentMethodOptions.find(o => o.value === value)?.icon || 'fa-money-bill';
  }
}
