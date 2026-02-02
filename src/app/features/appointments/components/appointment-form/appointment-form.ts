import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AppointmentsService } from '../../services/appointments.service';
import { PatientAutocompleteComponent } from '../../../../shared/components/patient-autocomplete/patient-autocomplete';
import { DentistSelectComponent } from '../../../../shared/components/dentist-select/dentist-select';
import { PatientSearchResult } from '../../../patients/models/patient.models';
import { DentistListItem } from '../../../../core/models/user.models';

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PatientAutocompleteComponent,
    DentistSelectComponent
  ],
  templateUrl: './appointment-form.html',
  styleUrls: ['./appointment-form.scss']
})
export class AppointmentFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private appointmentsService = inject(AppointmentsService);

  appointmentForm!: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  isEditMode = signal(false);
  appointmentId = signal<string | null>(null);
  
  selectedPatient = signal<PatientSearchResult | null>(null);
  selectedDentist = signal<DentistListItem | null>(null);

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
  }

  private initForm(): void {
    const queryParams = this.route.snapshot.queryParams;
    const startAt = queryParams['startAt'] ? new Date(queryParams['startAt']) : new Date();
    const endAt = queryParams['endAt'] ? new Date(queryParams['endAt']) : new Date(startAt.getTime() + 60 * 60 * 1000);

    this.appointmentForm = this.fb.group({
      patientId: ['', Validators.required],
      userId: ['', Validators.required],
      startAt: [this.formatDateTimeLocal(startAt), Validators.required],
      endAt: [this.formatDateTimeLocal(endAt), Validators.required],
      reason: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.appointmentId.set(id);
      this.loadAppointment(id);
    }
  }

  private loadAppointment(id: string): void {
    this.loading.set(true);
    this.appointmentsService.getById(id).subscribe({
      next: (appointment) => {
        this.appointmentForm.patchValue({
          patientId: appointment.patientId,
          userId: appointment.userId || '',
          startAt: this.formatDateTimeLocal(appointment.startAt),
          endAt: this.formatDateTimeLocal(appointment.endAt),
          reason: appointment.reason
        });
        
        this.selectedPatient.set({
          id: appointment.patientId,
          name: appointment.patientName,
          email: '',
          phone: ''
        });
        
        if (appointment.userId && appointment.doctorName) {
          this.selectedDentist.set({
            id: appointment.userId,
            name: appointment.doctorName,
            specialization: undefined
          });
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading appointment:', error);
        this.error.set('Error al cargar la cita');
        this.loading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formValue = this.appointmentForm.value;
    const startAt = new Date(formValue.startAt);
    const endAt = new Date(formValue.endAt);

    if (this.isEditMode() && this.appointmentId()) {
      this.appointmentsService.reschedule(this.appointmentId()!, {
        newStartAt: startAt,
        newEndAt: endAt
      }).subscribe({
        next: () => {
          this.router.navigate(['/appointments']);
        },
        error: (error) => {
          console.error('Error updating appointment:', error);
          this.error.set('Error al actualizar la cita');
          this.loading.set(false);
        }
      });
    } else {
      this.appointmentsService.create({
        patientId: formValue.patientId,
        userId: formValue.userId,
        startAt: startAt,
        endAt: endAt,
        reason: formValue.reason
      }).subscribe({
        next: () => {
          this.router.navigate(['/appointments']);
        },
        error: (error) => {
          console.error('Error creating appointment:', error);
          this.error.set('Error al crear la cita');
          this.loading.set(false);
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/appointments']);
  }

  private formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  getFieldError(fieldName: string): string | null {
    const field = this.appointmentForm.get(fieldName);
    if (field?.invalid && field?.touched) {
      if (field.errors?.['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors?.['minlength']) {
        return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      }
    }
    return null;
  }

  onPatientSelected(patient: PatientSearchResult | null): void {
    this.selectedPatient.set(patient);
    if (patient) {
      this.appointmentForm.patchValue({ patientId: patient.id });
    } else {
      this.appointmentForm.patchValue({ patientId: '' });
    }
  }

  onDentistSelected(dentist: DentistListItem | null): void {
    this.selectedDentist.set(dentist);
    if (dentist) {
      this.appointmentForm.patchValue({ userId: dentist.id });
    } else {
      this.appointmentForm.patchValue({ userId: '' });
    }
  }
}
