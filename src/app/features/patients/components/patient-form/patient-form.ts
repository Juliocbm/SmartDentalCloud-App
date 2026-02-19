import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { PatientsService } from '../../services/patients.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { Patient, CreatePatientRequest, UpdatePatientRequest } from '../../models/patient.models';

@Component({
  selector: 'app-patient-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, PageHeaderComponent],
  templateUrl: './patient-form.html',
  styleUrl: './patient-form.scss'
})
export class PatientFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private patientsService = inject(PatientsService);
  private logger = inject(LoggingService);

  patientForm!: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  isEditMode = signal(false);
  patientId = signal<string | null>(null);
  calculatedAge = signal<number | null>(null);

  breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Pacientes', route: '/patients', icon: 'fa-users' },
    { label: this.isEditMode() ? 'Editar' : 'Nuevo' }
  ]);

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
    this.setupAgeCalculation();
  }

  private initForm(): void {
    this.patientForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      dateOfBirth: [null],
      phoneNumber: ['', [Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.email]]
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
          phoneNumber: patient.phoneNumber,
          email: patient.email
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Error loading patient:', err);
        this.error.set('Error al cargar el paciente. Por favor intente nuevamente.');
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
      this.markFormGroupTouched(this.patientForm);
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
        this.error.set('Error al crear el paciente. Por favor intente nuevamente.');
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
        this.error.set('Error al actualizar el paciente. Por favor intente nuevamente.');
        this.loading.set(false);
      }
    });
  }

  onCancel(): void {
    if (this.isEditMode()) {
      this.router.navigate(['/patients', this.patientId()]);
    } else {
      this.router.navigate(['/patients']);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.patientForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.patientForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'Este campo es requerido';
    if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    if (field.errors['email']) return 'Email inválido';
    if (field.errors['pattern']) return 'Formato inválido (10 dígitos)';

    return 'Campo inválido';
  }
}
