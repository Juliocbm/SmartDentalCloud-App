import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { PatientAutocompleteComponent } from '../../../../shared/components/patient-autocomplete/patient-autocomplete';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { PatientSearchResult } from '../../../patients/models/patient.models';
import { ServiceSelectComponent } from '../service-select/service-select';
import { DentalService } from '../../models/service.models';
import { InvoicesService } from '../../services/invoices.service';
import { CreateInvoiceRequest, CreateInvoiceItemRequest, CFDI_USO_OPTIONS, CFDI_METODO_PAGO_OPTIONS, CFDI_FORMA_PAGO_OPTIONS } from '../../models/invoice.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, PageHeaderComponent, PatientAutocompleteComponent, ServiceSelectComponent, ModalComponent],
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

  // Item Modal State
  showItemModal = signal(false);
  editingItemIndex = signal<number | null>(null);
  itemForm!: FormGroup;

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
      items: this.fb.array([])
    });
    this.initItemForm();
  }

  private initItemForm(): void {
    this.itemForm = this.fb.group({
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

  openAddItemModal(): void {
    this.editingItemIndex.set(null);
    this.initItemForm();
    this.showItemModal.set(true);
  }

  openEditItemModal(index: number): void {
    this.editingItemIndex.set(index);
    const itemValue = this.items.at(index).value;
    this.initItemForm();
    this.itemForm.patchValue(itemValue);
    this.showItemModal.set(true);
  }

  confirmItemModal(): void {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }

    const index = this.editingItemIndex();
    if (index !== null) {
      this.items.at(index).patchValue(this.itemForm.value);
    } else {
      this.items.push(this.createItemGroupFromModal());
    }
    this.closeItemModal();
  }

  closeItemModal(): void {
    this.showItemModal.set(false);
    this.editingItemIndex.set(null);
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  private createItemGroupFromModal(): FormGroup {
    const v = this.itemForm.value;
    return this.fb.group({
      treatmentId: [v.treatmentId],
      description: [v.description, [Validators.required, Validators.minLength(3)]],
      quantity: [v.quantity, [Validators.required, Validators.min(0.01)]],
      unitPrice: [v.unitPrice, [Validators.required, Validators.min(0)]],
      discountPercentage: [v.discountPercentage, [Validators.min(0), Validators.max(100)]],
      taxRate: [v.taxRate, [Validators.min(0), Validators.max(100)]],
      claveProdServ: [v.claveProdServ],
      claveUnidad: [v.claveUnidad],
      noIdentificacion: [v.noIdentificacion]
    });
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
        this.notifications.error(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  onModalServiceSelected(service: DentalService | null): void {
    if (service) {
      this.itemForm.patchValue({
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

  isModalFieldInvalid(fieldName: string): boolean {
    const field = this.itemForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  get isEditingItem(): boolean {
    return this.editingItemIndex() !== null;
  }

  get modalItemSubtotal(): number {
    const v = this.itemForm.value;
    return (v.quantity || 0) * (v.unitPrice || 0);
  }

  get modalItemDiscount(): number {
    return this.modalItemSubtotal * ((this.itemForm.value.discountPercentage || 0) / 100);
  }

  get modalItemTax(): number {
    return (this.modalItemSubtotal - this.modalItemDiscount) * ((this.itemForm.value.taxRate || 0) / 100);
  }

  get modalItemTotal(): number {
    return this.modalItemSubtotal - this.modalItemDiscount + this.modalItemTax;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }
}
