import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { PatientsService } from '../../services/patients.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { Patient, CreatePatientRequest, UpdatePatientRequest, MaritalStatus, Gender } from '../../models/patient.models';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { isFieldInvalid, getFieldError, markFormGroupTouched, applyServerErrors } from '../../../../core/utils/form-error.utils';
import { DatePickerComponent } from '../../../../shared/components/date-picker/date-picker';
import { CatalogsService, StateDto, MunicipalityDto } from '../../../../core/services/catalogs.service';

@Component({
  selector: 'app-patient-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, PageHeaderComponent, DatePickerComponent],
  templateUrl: './patient-form.html',
  styleUrl: './patient-form.scss'
})
export class PatientFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private patientsService = inject(PatientsService);
  private logger = inject(LoggingService);
  private catalogsService = inject(CatalogsService);

  patientForm!: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  isEditMode = signal(false);
  patientId = signal<string | null>(null);
  calculatedAge = signal<number | null>(null);
  states = signal<StateDto[]>([]);
  municipalities = signal<MunicipalityDto[]>([]);
  selectedStateId = signal<number | null>(null);

  breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Pacientes', route: '/patients', icon: 'fa-users' },
    { label: this.isEditMode() ? 'Editar' : 'Nuevo' }
  ]);

  ngOnInit(): void {
    this.initForm();
    this.loadStates();
    this.checkEditMode();
    this.setupAgeCalculation();
  }

  genderOptions = Object.values(Gender);
  maritalStatusOptions = Object.values(MaritalStatus);

  private initForm(): void {
    this.patientForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      dateOfBirth: [null],
      gender: [''],
      phoneNumber: ['', [Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.email]],
      address: [''],
      // NOM-024: Identificación oficial
      curp: ['', [Validators.pattern(/^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/)]],
      state: ['', [Validators.maxLength(100)]],
      municipality: ['', [Validators.maxLength(100)]],
      locality: ['', [Validators.maxLength(100)]],
      zipCode: ['', [Validators.pattern(/^\d{5}$/)]],
      occupation: ['', [Validators.maxLength(100)]],
      maritalStatus: [''],
      // Contacto de emergencia
      emergencyContactName: ['', [Validators.maxLength(200)]],
      emergencyContactPhone: ['', [Validators.pattern(/^\d{10}$/)]]
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.patientId.set(id);
      this.loadPatient(id);
    }
  }

  private setupAgeCalculation(): void {
    this.patientForm.get('dateOfBirth')?.valueChanges.subscribe(date => {
      if (date) {
        const age = this.calculateAge(new Date(date));
        this.calculatedAge.set(age);
      } else {
        this.calculatedAge.set(null);
      }
    });
  }

  private loadPatient(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.patientsService.getById(id).subscribe({
      next: (patient) => {
        this.patientForm.patchValue({
          firstName: patient.firstName,
          lastName: patient.lastName,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender || '',
          phoneNumber: patient.phoneNumber,
          email: patient.email,
          address: patient.address || '',
          curp: patient.curp || '',
          state: patient.state || '',
          municipality: patient.municipality || '',
        });
        // Load municipalities if state matches a catalog entry
        if (patient.state) {
          const matchedState = this.states().find(
            s => s.name.toLowerCase() === patient.state?.toLowerCase()
          );
          if (matchedState) {
            this.selectedStateId.set(matchedState.id);
            this.catalogsService.getMunicipalitiesByState(matchedState.id).subscribe({
              next: (munis) => this.municipalities.set(munis)
            });
          }
        }
        this.patientForm.patchValue({
          locality: patient.locality || '',
          zipCode: patient.zipCode || '',
          occupation: patient.occupation || '',
          maritalStatus: patient.maritalStatus || '',
          emergencyContactName: patient.emergencyContactName || '',
          emergencyContactPhone: patient.emergencyContactPhone || ''
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading patient:', err);
        this.error.set(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  onSubmit(): void {
    if (this.patientForm.invalid) {
      markFormGroupTouched(this.patientForm);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formValue = this.patientForm.value;

    if (this.isEditMode()) {
      this.updatePatient(formValue);
    } else {
      this.createPatient(formValue);
    }
  }

  private createPatient(data: CreatePatientRequest): void {
    this.patientsService.create(data).subscribe({
      next: (patient) => {
        this.router.navigate(['/patients', patient.id]);
      },
      error: (err) => {
        this.logger.error('Error creating patient:', err);
        this.error.set(applyServerErrors(err, this.patientForm));
        this.loading.set(false);
      }
    });
  }

  private updatePatient(data: Partial<UpdatePatientRequest>): void {
    const id = this.patientId();
    if (!id) return;

    this.patientsService.update(id, { ...data, id } as UpdatePatientRequest).subscribe({
      next: () => {
        this.router.navigate(['/patients', id]);
      },
      error: (err) => {
        this.logger.error('Error updating patient:', err);
        this.error.set(applyServerErrors(err, this.patientForm));
        this.loading.set(false);
      }
    });
  }

  private loadStates(): void {
    this.catalogsService.getStates().subscribe({
      next: (states) => this.states.set(states),
      error: (err) => this.logger.error('Error loading states:', err)
    });
  }

  onStateChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const stateName = select.value;
    this.patientForm.get('state')?.setValue(stateName);
    this.patientForm.get('municipality')?.setValue('');
    this.municipalities.set([]);
    this.selectedStateId.set(null);

    if (stateName) {
      const matched = this.states().find(s => s.name === stateName);
      if (matched) {
        this.selectedStateId.set(matched.id);
        this.catalogsService.getMunicipalitiesByState(matched.id).subscribe({
          next: (munis) => this.municipalities.set(munis),
          error: (err) => this.logger.error('Error loading municipalities:', err)
        });
      }
    }
  }

  onMunicipalityChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.patientForm.get('municipality')?.setValue(select.value);
  }

  onCancel(): void {
    if (this.isEditMode()) {
      this.router.navigate(['/patients', this.patientId()]);
    } else {
      this.router.navigate(['/patients']);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    return isFieldInvalid(this.patientForm, fieldName);
  }

  onCurpInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.patientForm.get('curp')?.setValue(input.value, { emitEvent: false });
  }

  getFieldError(fieldName: string): string {
    const patternMessages: Record<string, string> = {
      phoneNumber: 'Formato inválido (10 dígitos)',
      curp: 'CURP inválido (18 caracteres, ej: GARC850101HDFRRL09)',
      zipCode: 'Código postal inválido (5 dígitos)',
      emergencyContactPhone: 'Formato inválido (10 dígitos)'
    };
    return getFieldError(this.patientForm, fieldName, {
      pattern: () => patternMessages[fieldName] || 'Formato inválido'
    }) || '';
  }
}
