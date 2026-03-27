import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { PatientsService } from '../../services/patients.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Patient, CreatePatientRequest, CreatePatientResponse, UpdatePatientRequest, MaritalStatus, Gender } from '../../models/patient.models';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { isFieldInvalid, getFieldError, markFormGroupTouched, applyServerErrors } from '../../../../core/utils/form-error.utils';
import { curpValidator, phoneValidator, postalCodeValidator } from '../../../../core/validators/mx-validators';
import { InputFormatDirective } from '../../../../shared/directives/input-format.directive';
import { DatePickerComponent } from '../../../../shared/components/date-picker/date-picker';
import { FormSelectComponent, SelectOption } from '../../../../shared/components/form-select/form-select';
import { CatalogsService, StateDto, MunicipalityDto } from '../../../../core/services/catalogs.service';
import { FormAlertComponent } from '../../../../shared/components/form-alert/form-alert';

/** Mapa de retrocompatibilidad para valores legacy de Gender almacenados en BD */
const GENDER_LEGACY_MAP: Record<string, string> = {
  'M': 'Masculino',
  'F': 'Femenino',
  'O': 'Otro',
};

@Component({
  selector: 'app-patient-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, PageHeaderComponent, DatePickerComponent, FormSelectComponent, InputFormatDirective, FormAlertComponent],
  templateUrl: './patient-form.html',
  styleUrl: './patient-form.scss'
})
export class PatientFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private patientsService = inject(PatientsService);
  private logger = inject(LoggingService);
  private notifications = inject(NotificationService);
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
  stateOptions = computed<SelectOption[]>(() =>
    this.states().map(s => ({ value: s.name, label: s.name }))
  );
  municipalityOptions = computed<SelectOption[]>(() =>
    this.municipalities().map(m => ({ value: m.name, label: m.name }))
  );

  collapsedSections = signal<Set<string>>(new Set(['additional']));

  isSectionCollapsed(key: string): boolean {
    return this.collapsedSections().has(key);
  }

  toggleSection(key: string): void {
    const current = new Set(this.collapsedSections());
    if (current.has(key)) {
      current.delete(key);
    } else {
      current.add(key);
    }
    this.collapsedSections.set(current);
  }

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
    this.setupStateChange();
  }

  genderOptions: SelectOption[] = Object.values(Gender).map(g => ({ value: g, label: g }));
  maritalStatusOptions: SelectOption[] = Object.values(MaritalStatus).map(ms => ({ value: ms, label: ms }));

  private initForm(): void {
    this.patientForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      dateOfBirth: [null],
      gender: [''],
      phoneNumber: ['', [phoneValidator()]],
      email: ['', [Validators.email]],
      address: [''],
      // NOM-024: Identificación oficial
      curp: ['', [curpValidator()]],
      state: ['', [Validators.maxLength(100)]],
      municipality: ['', [Validators.maxLength(100)]],
      locality: ['', [Validators.maxLength(100)]],
      zipCode: ['', [postalCodeValidator()]],
      occupation: ['', [Validators.maxLength(100)]],
      maritalStatus: [''],
      // Contacto de emergencia
      emergencyContactName: ['', [Validators.maxLength(200)]],
      emergencyContactPhone: ['', [phoneValidator()]]
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
          // PAC-BUG-008: mapa de retrocompatibilidad para valores legacy ('M'→'Masculino', 'F'→'Femenino')
          gender: (patient.gender ? GENDER_LEGACY_MAP[patient.gender] ?? patient.gender : '') || '',
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
      next: async (response: CreatePatientResponse) => {
        if (response.requiresConfirmation) {
          // Mostrar advertencias de duplicados y pedir confirmación
          const warningMessages = response.duplicateWarnings
            .map(w => `\u2022 ${w.message}`)
            .join('\n');

          const confirmed = await this.notifications.confirm(
            `Se encontraron posibles duplicados:\n\n${warningMessages}\n\n¿Desea crear el paciente de todas formas?`,
            {
              title: 'Posible Duplicado Detectado',
              confirmText: 'Crear de Todas Formas',
              cancelText: 'Cancelar',
              type: 'warning'
            }
          );

          if (confirmed) {
            this.patientsService.create({ ...data, confirmDuplicates: true }).subscribe({
              next: (confirmedResponse: CreatePatientResponse) => {
                this.notifications.success('Paciente creado exitosamente');
                this.router.navigate(['/patients', confirmedResponse.patient!.id]);
              },
              error: (err) => {
                this.logger.error('Error creating patient:', err);
                this.error.set(applyServerErrors(err, this.patientForm));
                this.loading.set(false);
              }
            });
          } else {
            this.loading.set(false);
          }
        } else {
          // PAC-BUG-007: toast de éxito en creación
          this.notifications.success('Paciente creado exitosamente');
          this.router.navigate(['/patients', response.patient!.id]);
        }
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
        // PAC-BUG-007: toast de éxito en actualización
        this.notifications.success('Paciente actualizado exitosamente');
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

  private setupStateChange(): void {
    this.patientForm.get('state')?.valueChanges.subscribe(stateName => {
      this.onStateChange(stateName);
    });
  }

  onStateChange(stateName: string): void {
    this.patientForm.get('municipality')?.setValue('', { emitEvent: false });
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

  onMunicipalityChange(municipalityName: string): void {
    this.patientForm.get('municipality')?.setValue(municipalityName);
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

  getFieldError(fieldName: string): string {
    return getFieldError(this.patientForm, fieldName) || '';
  }
}
