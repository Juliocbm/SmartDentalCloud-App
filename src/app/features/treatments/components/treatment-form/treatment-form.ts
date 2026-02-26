import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { PatientAutocompleteComponent } from '../../../../shared/components/patient-autocomplete/patient-autocomplete';
import { ServiceAutocompleteComponent } from '../../../../shared/components/service-autocomplete/service-autocomplete';
import { TreatmentsService } from '../../services/treatments.service';
import { TreatmentStatus, SURFACE_OPTIONS, QUADRANT_OPTIONS } from '../../models/treatment.models';
import { PatientSearchResult } from '../../../patients/models/patient.models';
import { DentalService } from '../../../invoices/models/service.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

@Component({
  selector: 'app-treatment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    PatientAutocompleteComponent,
    ServiceAutocompleteComponent
  ],
  templateUrl: './treatment-form.html',
  styleUrl: './treatment-form.scss'
})
export class TreatmentFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private treatmentsService = inject(TreatmentsService);
  private notifications = inject(NotificationService);
  private logger = inject(LoggingService);

  form!: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  isEditMode = signal(false);
  treatmentId = signal<string | null>(null);

  selectedPatient = signal<PatientSearchResult | null>(null);
  selectedService = signal<DentalService | null>(null);

  // Constants
  surfaceOptions = SURFACE_OPTIONS;
  quadrantOptions = QUADRANT_OPTIONS;
  statusOptions = Object.values(TreatmentStatus);

  breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Tratamientos', route: '/treatments' },
    { label: this.isEditMode() ? 'Editar' : 'Nuevo' }
  ]);

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
  }

  private initForm(): void {
    this.form = this.fb.group({
      patientId: ['', Validators.required],
      serviceId: ['', Validators.required],
      startDate: [this.formatDateForInput(new Date()), Validators.required],
      endDate: [''],
      toothNumber: [''],
      surface: [''],
      quadrant: [null],
      isMultipleTooth: [false],
      status: [TreatmentStatus.InProgress],
      duration: [null],
      appointmentId: [''],
      treatmentPlanItemId: [''],
      notes: ['']
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.treatmentId.set(id);
      this.loadTreatment(id);
    }
  }

  private loadTreatment(id: string): void {
    this.loading.set(true);
    this.treatmentsService.getById(id).subscribe({
      next: (treatment) => {
        this.form.patchValue({
          patientId: treatment.patientId,
          serviceId: treatment.serviceId,
          startDate: this.formatDateForInput(new Date(treatment.startDate)),
          endDate: treatment.endDate ? this.formatDateForInput(new Date(treatment.endDate)) : '',
          toothNumber: treatment.toothNumber || '',
          surface: treatment.surface || '',
          quadrant: treatment.quadrant || null,
          isMultipleTooth: treatment.isMultipleTooth,
          status: treatment.status,
          duration: treatment.duration || null,
          appointmentId: treatment.appointmentId || '',
          treatmentPlanItemId: treatment.treatmentPlanItemId || '',
          notes: treatment.notes || ''
        });

        if (treatment.patientName) {
          this.selectedPatient.set({
            id: treatment.patientId,
            name: treatment.patientName || '',
            email: '',
            phone: ''
          });
        }

        if (treatment.serviceName) {
          this.selectedService.set({
            id: treatment.serviceId,
            name: treatment.serviceName || '',
            cost: treatment.serviceCost || 0,
            durationMinutes: treatment.duration || null,
            description: null,
            isActive: true,
            claveProdServ: null,
            claveUnidad: null
          });
        }

        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading treatment for edit:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  onPatientSelected(patient: PatientSearchResult | null): void {
    this.selectedPatient.set(patient);
    this.form.patchValue({ patientId: patient?.id || '' });
  }

  onServiceSelected(service: DentalService | null): void {
    this.selectedService.set(service);
    this.form.patchValue({ serviceId: service?.id || '' });
    if (service?.durationMinutes) {
      this.form.patchValue({ duration: service.durationMinutes });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formValue = this.form.value;
    const request = {
      ...formValue,
      startDate: new Date(formValue.startDate).toISOString(),
      endDate: formValue.endDate ? new Date(formValue.endDate).toISOString() : undefined,
      quadrant: formValue.quadrant ? Number(formValue.quadrant) : undefined,
      duration: formValue.duration ? Number(formValue.duration) : undefined,
      appointmentId: formValue.appointmentId || undefined,
      treatmentPlanItemId: formValue.treatmentPlanItemId || undefined
    };

    if (this.isEditMode()) {
      const updateRequest = { id: this.treatmentId()!, ...request };
      this.treatmentsService.update(this.treatmentId()!, updateRequest).subscribe({
        next: (treatment) => {
          this.notifications.success('Tratamiento actualizado exitosamente');
          this.router.navigate(['/treatments', treatment.id]);
        },
        error: (err) => {
          this.logger.error('Error updating treatment:', err);
          this.error.set(getApiErrorMessage(err));
          this.loading.set(false);
        }
      });
    } else {
      this.treatmentsService.create(request).subscribe({
        next: (treatment) => {
          this.notifications.success('Tratamiento registrado exitosamente');
          this.router.navigate(['/treatments', treatment.id]);
        },
        error: (err) => {
          this.logger.error('Error creating treatment:', err);
          this.error.set(getApiErrorMessage(err));
          this.loading.set(false);
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/treatments']);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && control.touched);
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
