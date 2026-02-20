import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { PatientAutocompleteComponent } from '../../../../shared/components/patient-autocomplete/patient-autocomplete';
import { ServiceSelectComponent } from '../../../invoices/components/service-select/service-select';
import { TreatmentPlansService } from '../../services/treatment-plans.service';
import { ItemPriority, CreateTreatmentPlanRequest, CreateTreatmentPlanItemRequest } from '../../models/treatment-plan.models';
import { PatientSearchResult } from '../../../patients/models/patient.models';
import { DentalService } from '../../../invoices/models/service.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';

@Component({
  selector: 'app-treatment-plan-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    PatientAutocompleteComponent,
    ServiceSelectComponent
  ],
  templateUrl: './treatment-plan-form.html',
  styleUrl: './treatment-plan-form.scss'
})
export class TreatmentPlanFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private plansService = inject(TreatmentPlansService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);

  // State
  loading = signal(false);
  error = signal<string | null>(null);
  selectedPatient = signal<PatientSearchResult | null>(null);

  // Form
  form!: FormGroup;

  // Config
  priorityOptions = Object.values(ItemPriority);

  breadcrumbItems = signal<BreadcrumbItem[]>([
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Planes de Tratamiento', route: '/treatment-plans' },
    { label: 'Nuevo Plan' }
  ]);

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      patientId: ['', Validators.required],
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      diagnosis: [''],
      estimatedStartDate: [''],
      estimatedEndDate: [''],
      items: this.fb.array([], Validators.required)
    });

    // Add first empty item
    this.addItem();
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  addItem(): void {
    const itemGroup = this.fb.group({
      serviceId: [''],
      serviceName: [''],
      description: ['', Validators.required],
      notes: [''],
      priority: [ItemPriority.Medium],
      estimatedCost: [0, [Validators.required, Validators.min(0)]],
      discount: [0, Validators.min(0)],
      treatmentPhase: [''],
      estimatedDate: ['']
    });

    this.items.push(itemGroup);
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  onPatientSelected(patient: PatientSearchResult | null): void {
    this.selectedPatient.set(patient);
    this.form.patchValue({ patientId: patient?.id || '' });
  }

  onItemServiceSelected(index: number, service: DentalService | null): void {
    const item = this.items.at(index);
    if (service) {
      item.patchValue({
        serviceId: service.id,
        serviceName: service.name,
        description: item.get('description')?.value || service.name,
        estimatedCost: service.cost || 0
      });
    } else {
      item.patchValue({ serviceId: '', serviceName: '' });
    }
  }

  getTotalEstimated(): number {
    return this.items.controls.reduce((total, item) => {
      const cost = item.get('estimatedCost')?.value || 0;
      const discount = item.get('discount')?.value || 0;
      return total + (cost - discount);
    }, 0);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formValue = this.form.value;
    const request: CreateTreatmentPlanRequest = {
      patientId: formValue.patientId,
      title: formValue.title,
      description: formValue.description || undefined,
      diagnosis: formValue.diagnosis || undefined,
      estimatedStartDate: formValue.estimatedStartDate || undefined,
      estimatedEndDate: formValue.estimatedEndDate || undefined,
      items: formValue.items.map((item: CreateTreatmentPlanItemRequest) => ({
        serviceId: item.serviceId || undefined,
        description: item.description,
        notes: item.notes || undefined,
        priority: item.priority,
        estimatedCost: item.estimatedCost,
        discount: item.discount || undefined,
        treatmentPhase: item.treatmentPhase || undefined,
        estimatedDate: item.estimatedDate || undefined
      }))
    };

    this.plansService.create(request).subscribe({
      next: (plan) => {
        this.notifications.success('Plan de tratamiento creado exitosamente.');
        this.router.navigate(['/treatment-plans', plan.id]);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error creating treatment plan:', err);
        this.error.set('Error al crear el plan de tratamiento.');
        this.loading.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/treatment-plans']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  isItemFieldInvalid(index: number, fieldName: string): boolean {
    const field = this.items.at(index)?.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}
