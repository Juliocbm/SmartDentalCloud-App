import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { PatientAutocompleteComponent } from '../../../../shared/components/patient-autocomplete/patient-autocomplete';
import { PatientSearchResult } from '../../../patients/models/patient.models';
import { ServiceSelectComponent } from '../service-select/service-select';
import { DentalService } from '../../models/service.models';
import { InvoicesService } from '../../services/invoices.service';
import { CreateInvoiceRequest, CreateInvoiceItemRequest, CFDI_USO_OPTIONS, CFDI_METODO_PAGO_OPTIONS, CFDI_FORMA_PAGO_OPTIONS } from '../../models/invoice.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, PageHeaderComponent, PatientAutocompleteComponent, ServiceSelectComponent],
  templateUrl: './invoice-form.html',
  styleUrl: './invoice-form.scss'
})
export class InvoiceFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private invoicesService = inject(InvoicesService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);

  // State
  loading = signal(false);
  error = signal<string | null>(null);
  form!: FormGroup;
  selectedPatient = signal<PatientSearchResult | null>(null);

  // Constants
  cfdiUsoOptions = CFDI_USO_OPTIONS;
  cfdiMetodoPagoOptions = CFDI_METODO_PAGO_OPTIONS;
  cfdiFormaPagoOptions = CFDI_FORMA_PAGO_OPTIONS;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Facturas', route: '/invoices' },
    { label: 'Nueva Factura' }
  ];

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      patientId: ['', Validators.required],
      usoCFDI: ['G03'],
      metodoPago: ['PUE'],
      formaPago: ['01'],
      items: this.fb.array([this.createItemGroup()])
    });
  }

  private createItemGroup(): FormGroup {
    return this.fb.group({
      treatmentId: [''],
      description: ['', [Validators.required, Validators.minLength(3)]],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      discountPercentage: [0, [Validators.min(0), Validators.max(100)]],
      taxRate: [16, [Validators.min(0), Validators.max(100)]],
      claveProdServ: ['85121800'],
      claveUnidad: ['E48'],
      noIdentificacion: ['']
    });
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  addItem(): void {
    this.items.push(this.createItemGroup());
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  calculateItemSubtotal(item: AbstractControl): number {
    const v = item.value;
    return (v.quantity || 0) * (v.unitPrice || 0);
  }

  calculateItemDiscount(item: AbstractControl): number {
    const subtotal = this.calculateItemSubtotal(item);
    return subtotal * ((item.value.discountPercentage || 0) / 100);
  }

  calculateItemTax(item: AbstractControl): number {
    const subtotal = this.calculateItemSubtotal(item);
    const discount = this.calculateItemDiscount(item);
    return (subtotal - discount) * ((item.value.taxRate || 0) / 100);
  }

  calculateItemTotal(item: AbstractControl): number {
    const subtotal = this.calculateItemSubtotal(item);
    const discount = this.calculateItemDiscount(item);
    const tax = this.calculateItemTax(item);
    return subtotal - discount + tax;
  }

  calculateInvoiceTotal(): number {
    return this.items.controls.reduce((total, item) => {
      return total + this.calculateItemTotal(item);
    }, 0);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Por favor completa todos los campos requeridos');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formValue = this.form.value;
    const request: CreateInvoiceRequest = {
      patientId: formValue.patientId,
      usoCFDI: formValue.usoCFDI || undefined,
      metodoPago: formValue.metodoPago || undefined,
      formaPago: formValue.formaPago || undefined,
      items: formValue.items.map((item: CreateInvoiceItemRequest) => ({
        treatmentId: item.treatmentId || undefined,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercentage: item.discountPercentage || 0,
        taxRate: item.taxRate || 16,
        claveProdServ: item.claveProdServ || undefined,
        claveUnidad: item.claveUnidad || undefined,
        noIdentificacion: item.noIdentificacion || undefined
      } as CreateInvoiceItemRequest))
    };

    this.invoicesService.create(request).subscribe({
      next: (invoice) => {
        this.notifications.success('Factura creada correctamente.');
        this.router.navigate(['/invoices', invoice.id]);
      },
      error: (err) => {
        this.logger.error('Error creating invoice:', err);
        this.notifications.error('Error al crear la factura. Por favor intenta de nuevo.');
        this.loading.set(false);
      }
    });
  }

  onServiceSelected(index: number, service: DentalService | null): void {
    const itemGroup = this.items.at(index);
    if (service) {
      itemGroup.patchValue({
        description: service.name,
        unitPrice: service.cost,
        claveProdServ: service.claveProdServ || '85121800',
        claveUnidad: service.claveUnidad || 'E48'
      });
    }
  }

  onPatientSelected(patient: PatientSearchResult | null): void {
    this.selectedPatient.set(patient);
    if (patient) {
      this.form.patchValue({ patientId: patient.id });
    } else {
      this.form.patchValue({ patientId: '' });
    }
  }

  onCancel(): void {
    this.router.navigate(['/invoices']);
  }

  getFieldError(fieldName: string): string | null {
    const field = this.form.get(fieldName);
    if (field?.invalid && field?.touched) {
      if (field.errors?.['required']) {
        return 'Este campo es requerido';
      }
    }
    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isItemFieldInvalid(itemIndex: number, fieldName: string): boolean {
    const field = this.items.at(itemIndex).get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }
}
