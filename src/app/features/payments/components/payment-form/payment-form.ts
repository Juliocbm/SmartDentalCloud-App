import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { PaymentsService } from '../../services/payments.service';
import { PaymentMethod, PAYMENT_METHOD_CONFIG } from '../../models/payment.models';
import { InvoicesService } from '../../../invoices/services/invoices.service';
import { Invoice, InvoiceStatus } from '../../../invoices/models/invoice.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PageHeaderComponent],
  templateUrl: './payment-form.html',
  styleUrl: './payment-form.scss'
})
export class PaymentFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private paymentsService = inject(PaymentsService);
  private invoicesService = inject(InvoicesService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);

  // State
  invoices = signal<Invoice[]>([]);
  selectedInvoice = signal<Invoice | null>(null);
  loadingInvoices = signal(false);
  saving = signal(false);

  form!: FormGroup;
  paymentMethods = Object.values(PaymentMethod);
  PAYMENT_METHOD_CONFIG = PAYMENT_METHOD_CONFIG;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Pagos', route: '/payments' },
    { label: 'Registrar Pago' }
  ];

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    this.form = this.fb.group({
      invoiceId: ['', Validators.required],
      amount: [{ value: 0, disabled: true }, [Validators.required, Validators.min(0.01)]],
      paymentMethod: ['cash', Validators.required],
      paidAt: [today, Validators.required],
      reference: ['']
    });

    this.loadPendingInvoices();
  }

  private loadPendingInvoices(): void {
    this.loadingInvoices.set(true);
    this.invoicesService.getAll().subscribe({
      next: (data) => {
        this.invoices.set(
          data.filter(i => i.balance > 0 && i.status !== InvoiceStatus.Cancelled)
        );
        this.loadingInvoices.set(false);
      },
      error: () => {
        this.loadingInvoices.set(false);
      }
    });
  }

  onInvoiceChange(invoiceId: string): void {
    const inv = this.invoices().find(i => i.id === invoiceId) || null;
    this.selectedInvoice.set(inv);

    if (inv) {
      this.form.get('amount')?.enable();
      this.form.get('amount')?.setValidators([
        Validators.required,
        Validators.min(0.01),
        Validators.max(inv.balance)
      ]);
      this.form.get('amount')?.setValue(inv.balance);
      this.form.get('amount')?.updateValueAndValidity();
    } else {
      this.form.get('amount')?.disable();
      this.form.get('amount')?.setValue(0);
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const val = this.form.getRawValue();

    this.paymentsService.create({
      patientId: this.selectedInvoice()!.patientId,
      invoiceId: val.invoiceId,
      amount: val.amount,
      paymentMethod: val.paymentMethod,
      paidAt: new Date(val.paidAt),
      reference: val.reference?.trim() || undefined
    }).subscribe({
      next: () => {
        this.notifications.success('Pago registrado exitosamente');
        this.router.navigate(['/payments']);
      },
      error: (err) => {
        this.logger.error('Error creating payment:', err);
        this.notifications.error('Error al registrar el pago');
        this.saving.set(false);
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  isFieldInvalid(name: string): boolean {
    const f = this.form.get(name);
    return !!(f && f.invalid && (f.dirty || f.touched));
  }

  getFieldError(name: string): string | null {
    const f = this.form.get(name);
    if (!f?.invalid || !f?.touched) return null;
    if (f.errors?.['required']) return 'Este campo es requerido';
    if (f.errors?.['min']) return 'El monto debe ser mayor a $0';
    if (f.errors?.['max']) return `No puede exceder el saldo pendiente`;
    return null;
  }
}
