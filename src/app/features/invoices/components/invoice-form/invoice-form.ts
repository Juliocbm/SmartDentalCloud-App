import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { PatientAutocompleteComponent } from '../../../../shared/components/patient-autocomplete/patient-autocomplete';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { PatientSearchResult } from '../../../patients/models/patient.models';
import { ServiceSelectComponent } from '../service-select/service-select';
import { DentalService } from '../../models/service.models';
import { InvoicesService } from '../../services/invoices.service';
import { CreateInvoiceRequest, CreateInvoiceItemRequest, CFDI_USO_OPTIONS, CFDI_METODO_PAGO_OPTIONS, CFDI_FORMA_PAGO_OPTIONS } from '../../models/invoice.models';
import { ModalService } from '../../../../shared/services/modal.service';
import { UnbilledTreatmentsModalComponent, UnbilledTreatmentsModalData } from '../unbilled-treatments-modal/unbilled-treatments-modal';
import { UnbilledTreatment } from '../../../treatments/models/treatment.models';
import { TreatmentsService } from '../../../treatments/services/treatments.service';
import { TreatmentPlansService } from '../../../treatment-plans/services/treatment-plans.service';
import { PatientsService } from '../../../patients/services/patients.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { FormSelectComponent } from '../../../../shared/components/form-select/form-select';
import { SatClaveAutocompleteComponent, SatClaveItem } from '../../../../shared/components/sat-clave-autocomplete/sat-clave-autocomplete';
import { InvoiceFormContextService } from '../../services/invoice-form-context.service';
import { FormAlertComponent } from '../../../../shared/components/form-alert/form-alert';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, PageHeaderComponent, PatientAutocompleteComponent, ServiceSelectComponent, ModalComponent, FormSelectComponent, SatClaveAutocompleteComponent, FormAlertComponent],
  templateUrl: './invoice-form.html',
  styleUrl: './invoice-form.scss'
})
export class InvoiceFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private invoicesService = inject(InvoicesService);
  private modalService = inject(ModalService);
  private notifications = inject(NotificationService);
  private treatmentsService = inject(TreatmentsService);
  private treatmentPlansService = inject(TreatmentPlansService);
  private patientsService = inject(PatientsService);
  private logger = inject(LoggingService);
  private contextService = inject(InvoiceFormContextService);

  // State
  loading = signal(false);
  error = signal<string | null>(null);
  form!: FormGroup;
  selectedPatient = signal<PatientSearchResult | null>(null);
  isPatientLocked = signal(false);

  // Context Service / QueryParams from navigation
  private presetAppointmentId: string | null = null;

  backRoute = computed(() => this.contextService.context().returnUrl);
  isAdvanceMode = signal(false);
  advancePlanNumber = signal<string | null>(null);

  // Item Modal State
  showItemModal = signal(false);
  editingItemIndex = signal<number | null>(null);
  itemForm!: FormGroup;
  modalClaveProdServ = signal<string | null>(null);
  modalClaveUnidad = signal<string | null>(null);

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
    this.loadContext();
    this.handleQueryParams();
  }

  private loadContext(): void {
    const context = this.contextService.getCurrentContext();
    if (context.preselectedPatientId) {
      const result: PatientSearchResult = {
        id: context.preselectedPatientId,
        name: context.preselectedPatientName || '',
        email: '',
        phone: ''
      };
      this.selectedPatient.set(result);
      this.isPatientLocked.set(context.lockPatient);
      this.form.patchValue({ patientId: context.preselectedPatientId });
    }
  }

  private handleQueryParams(): void {
    const params = this.route.snapshot.queryParams;
    const patientId = params['patientId'];
    this.presetAppointmentId = params['appointmentId'] || null;
    const treatmentPlanId = params['treatmentPlanId'] || null;
    const mode = params['mode'] || null;

    // If patient already loaded from Context Service, only handle plan items
    const contextPatientId = this.selectedPatient()?.id;
    if (contextPatientId && treatmentPlanId) {
      if (mode === 'advance') {
        this.loadAdvanceItems(treatmentPlanId);
      } else {
        this.loadUnbilledFromPlan(contextPatientId, treatmentPlanId);
      }
      return;
    }

    // Fallback: load patient from queryParams (legacy/direct URL)
    if (patientId) {
      this.form.patchValue({ patientId });
      this.patientsService.getById(patientId).subscribe({
        next: (patient) => {
          const result: PatientSearchResult = { id: patient.id, name: `${patient.firstName} ${patient.lastName}`, email: patient.email || '', phone: patient.phoneNumber || '' };
          this.selectedPatient.set(result);

          if (treatmentPlanId && mode === 'advance') {
            this.loadAdvanceItems(treatmentPlanId);
          } else if (treatmentPlanId) {
            this.loadUnbilledFromPlan(patientId, treatmentPlanId);
          }
        },
        error: () => {}
      });
    }
  }

  private loadUnbilledFromPlan(patientId: string, treatmentPlanId: string): void {
    this.treatmentsService.getUnbilledByPatient(patientId, undefined, treatmentPlanId).subscribe({
      next: (treatments) => {
        if (treatments.length > 0) {
          this.addTreatmentsAsItems(treatments);
        }
      },
      error: () => {}
    });
  }

  private loadAdvanceItems(treatmentPlanId: string): void {
    this.treatmentPlansService.getById(treatmentPlanId).subscribe({
      next: (plan) => {
        this.isAdvanceMode.set(true);
        this.advancePlanNumber.set(plan.planNumber || plan.title);
        const pendingItems = plan.items.filter(i => i.status === 'Pending' || i.status === 'InProgress');
        for (const item of pendingItems) {
          const group = this.fb.group({
            treatmentId: [''],
            appointmentId: [''],
            treatmentPlanItemId: [item.id],
            description: [item.serviceName || item.description, [Validators.required, Validators.minLength(3)]],
            quantity: [1, [Validators.required, Validators.min(0.01)]],
            unitPrice: [item.estimatedCost - (item.discount || 0), [Validators.required, Validators.min(0)]],
            discountPercentage: [0, [Validators.min(0), Validators.max(100)]],
            taxRate: [16, [Validators.min(0), Validators.max(100)]],
            claveProdServ: ['85122001'],
            claveUnidad: ['E48'],
            noIdentificacion: ['']
          });
          this.items.push(group);
        }
        if (pendingItems.length > 0) {
          this.notifications.success(`${pendingItems.length} concepto(s) importado(s) del plan como anticipo.`);
        }
      },
      error: () => {}
    });
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
      appointmentId: [''],
      treatmentPlanItemId: [''],
      description: ['', [Validators.required, Validators.minLength(3)]],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      discountPercentage: [0, [Validators.min(0), Validators.max(100)]],
      taxRate: [16, [Validators.min(0), Validators.max(100)]],
      claveProdServ: ['85122001'],
      claveUnidad: ['E48'],
      noIdentificacion: ['']
    });
  }

  private createItemGroup(): FormGroup {
    return this.fb.group({
      treatmentId: [''],
      appointmentId: [''],
      treatmentPlanItemId: [''],
      description: ['', [Validators.required, Validators.minLength(3)]],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      discountPercentage: [0, [Validators.min(0), Validators.max(100)]],
      taxRate: [16, [Validators.min(0), Validators.max(100)]],
      claveProdServ: ['85122001'],
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
    this.modalClaveProdServ.set(null);
    this.modalClaveUnidad.set(null);
    this.showItemModal.set(true);
  }

  openEditItemModal(index: number): void {
    this.editingItemIndex.set(index);
    const itemValue = this.items.at(index).value;
    this.initItemForm();
    this.itemForm.patchValue(itemValue);
    this.modalClaveProdServ.set(itemValue.claveProdServ || null);
    this.modalClaveUnidad.set(itemValue.claveUnidad || null);
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
      appointmentId: [v.appointmentId],
      treatmentPlanItemId: [v.treatmentPlanItemId],
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
        appointmentId: item.appointmentId || undefined,
        treatmentPlanItemId: item.treatmentPlanItemId || undefined,
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
        this.contextService.resetContext();
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
        claveProdServ: service.claveProdServ || '85122001',
        claveUnidad: service.claveUnidad || 'E48'
      });
      this.modalClaveProdServ.set(service.claveProdServ || '85122001');
      this.modalClaveUnidad.set(service.claveUnidad || 'E48');
    }
  }

  onModalClaveProdServSelected(item: SatClaveItem | null): void {
    this.itemForm.patchValue({ claveProdServ: item?.clave || '85122001' });
    this.modalClaveProdServ.set(item?.clave || null);
  }

  onModalClaveUnidadSelected(item: SatClaveItem | null): void {
    this.itemForm.patchValue({ claveUnidad: item?.clave || 'E48' });
    this.modalClaveUnidad.set(item?.clave || null);
  }

  onPatientSelected(patient: PatientSearchResult | null): void {
    this.selectedPatient.set(patient);
    if (patient) {
      this.form.patchValue({ patientId: patient.id });
    } else {
      this.form.patchValue({ patientId: '' });
    }
  }

  openImportTreatmentsModal(): void {
    const patient = this.selectedPatient();
    if (!patient) {
      this.notifications.warning('Selecciona un paciente antes de importar tratamientos.');
      return;
    }

    const ref = this.modalService.open<UnbilledTreatmentsModalData, UnbilledTreatment[]>(
      UnbilledTreatmentsModalComponent,
      {
        data: {
          patientId: patient.id,
          patientName: patient.name
        },
        width: '700px'
      }
    );

    ref.afterClosed().subscribe((selected) => {
      if (selected && selected.length > 0) {
        this.addTreatmentsAsItems(selected);
      }
    });
  }

  private addTreatmentsAsItems(treatments: UnbilledTreatment[]): void {
    for (const t of treatments) {
      const group = this.fb.group({
        treatmentId: [t.id],
        appointmentId: [t.appointmentId || ''],
        treatmentPlanItemId: [t.treatmentPlanItemId || ''],
        description: [t.serviceName || 'Tratamiento', [Validators.required, Validators.minLength(3)]],
        quantity: [1, [Validators.required, Validators.min(0.01)]],
        unitPrice: [t.cost, [Validators.required, Validators.min(0)]],
        discountPercentage: [0, [Validators.min(0), Validators.max(100)]],
        taxRate: [16, [Validators.min(0), Validators.max(100)]],
        claveProdServ: [t.claveProdServ || '85122001'],
        claveUnidad: [t.claveUnidad || 'E48'],
        noIdentificacion: ['']
      });
      this.items.push(group);
    }
    this.notifications.success(`${treatments.length} tratamiento(s) importado(s) a la factura.`);
  }

  onCancel(): void {
    const returnUrl = this.contextService.getCurrentContext().returnUrl;
    this.contextService.resetContext();
    this.router.navigate([returnUrl]);
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
