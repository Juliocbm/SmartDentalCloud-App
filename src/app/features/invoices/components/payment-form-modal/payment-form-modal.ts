import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { ModalComponentBase, ModalRef, ModalConfig } from '../../../../shared/services/modal.service';
import { PaymentsService } from '../../services/payments.service';
import { Payment, PAYMENT_METHOD_OPTIONS } from '../../models/invoice.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';

export interface PaymentFormModalData {
  invoiceId: string;
  balance: number;
  patientName: string;
}

@Component({
  selector: 'app-payment-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './payment-form-modal.html',
  styleUrl: './payment-form-modal.scss'
})
export class PaymentFormModalComponent implements ModalComponentBase<PaymentFormModalData, Payment> {
  private fb = inject(FormBuilder);
  private paymentsService = inject(PaymentsService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);

  modalData?: PaymentFormModalData;
  modalRef?: ModalRef<PaymentFormModalData, Payment>;
  modalConfig?: ModalConfig<PaymentFormModalData>;

  form!: FormGroup;
  loading = signal(false);
  paymentMethods = PAYMENT_METHOD_OPTIONS;

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    this.form = this.fb.group({
      amount: [this.modalData?.balance || 0, [Validators.required, Validators.min(0.01), Validators.max(this.modalData?.balance || 0)]],
      paymentMethod: ['cash', Validators.required],
      paidAt: [today, Validators.required],
      reference: ['']
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const formValue = this.form.value;

    this.paymentsService.create({
      invoiceId: this.modalData!.invoiceId,
      amount: formValue.amount,
      paymentMethod: formValue.paymentMethod,
      paidAt: new Date(formValue.paidAt).toISOString(),
      reference: formValue.reference || undefined
    }).subscribe({
      next: (payment: Payment) => {
        this.notifications.success('Pago registrado correctamente.');
        this.modalRef?.close(payment);
      },
      error: (err: unknown) => {
        this.logger.error('Error creating payment:', err);
        this.notifications.error('Error al registrar el pago. Verifica los datos e intenta de nuevo.');
        this.loading.set(false);
      }
    });
  }

  onClose(): void {
    this.modalRef?.close();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string | null {
    const field = this.form.get(fieldName);
    if (field?.invalid && field?.touched) {
      if (field.errors?.['required']) return 'Este campo es requerido';
      if (field.errors?.['min']) return 'El monto debe ser mayor a $0';
      if (field.errors?.['max']) return `El monto no puede exceder el saldo pendiente (${this.formatCurrency(this.modalData?.balance || 0)})`;
    }
    return null;
  }
}
