import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { AppointmentsService } from '../../services/appointments.service';
import { AppointmentFormContextService } from '../../services/appointment-form-context.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { PatientAutocompleteComponent } from '../../../../shared/components/patient-autocomplete/patient-autocomplete';
import { DentistAutocompleteComponent } from '../../../../shared/components/dentist-autocomplete/dentist-autocomplete';
import { LocationAutocompleteComponent } from '../../../../shared/components/location-autocomplete/location-autocomplete';
import { LocationsService } from '../../../settings/services/locations.service';
import { PatientSearchResult } from '../../../patients/models/patient.models';
import { DentistListItem } from '../../../../core/models/user.models';
import { TimeSlot } from '../../models/appointment.models';
import { SettingsService } from '../../../settings/services/settings.service';
import { DaySchedule, DAY_ORDER } from '../../../settings/models/work-schedule.models';
import { ScheduleException, EXCEPTION_TYPE_LABELS } from '../../../settings/models/schedule-exception.models';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { NotificationService } from '../../../../core/services/notification.service';
import { DatePickerComponent } from '../../../../shared/components/date-picker/date-picker';

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PatientAutocompleteComponent,
    DentistAutocompleteComponent,
    LocationAutocompleteComponent,
    PageHeaderComponent,
    DatePickerComponent
  ],
  templateUrl: './appointment-form.html',
  styleUrls: ['./appointment-form.scss']
})
export class AppointmentFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private appointmentsService = inject(AppointmentsService);
  private contextService = inject(AppointmentFormContextService);
  private settingsService = inject(SettingsService);
  private logger = inject(LoggingService);
  private notifications = inject(NotificationService);
  locationsService = inject(LocationsService);

  selectedLocationId = signal<string | null>(null);

  appointmentForm!: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  isEditMode = signal(false);
  appointmentId = signal<string | null>(null);
  
  selectedPatient = signal<PatientSearchResult | null>(null);
  selectedDentist = signal<DentistListItem | null>(null);

  // Availability
  availabilitySlots = signal<TimeSlot[]>([]);
  checkingAvailability = signal(false);
  availabilityChecked = signal(false);

  // Work schedule
  workScheduleDays = signal<DaySchedule[]>([]);

  // Schedule exceptions
  scheduleExceptions = signal<ScheduleException[]>([]);

  backRoute = computed(() => this.contextService.context().returnUrl);

  breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Citas', route: '/appointments', icon: 'fa-calendar-days' },
    { label: this.isEditMode() ? 'Reagendar' : 'Nueva' }
  ]);

  ngOnInit(): void {
    this.initForm();
    this.loadContext();
    this.checkEditMode();
    this.loadWorkSchedule();
    this.loadScheduleExceptions();
    this.locationsService.getSummaries().subscribe();
  }

  ngOnDestroy(): void {
    this.contextService.resetContext();
  }

  private loadWorkSchedule(): void {
    this.settingsService.getWorkSchedule().subscribe({
      next: (schedule) => this.workScheduleDays.set(schedule.days),
      error: () => {} // Silent — use no schedule
    });
  }

  private loadScheduleExceptions(): void {
    const from = new Date();
    from.setDate(from.getDate() - 7);
    const to = new Date();
    to.setDate(to.getDate() + 90);
    const fromStr = from.toISOString().split('T')[0];
    const toStr = to.toISOString().split('T')[0];

    this.settingsService.getScheduleExceptions(fromStr, toStr).subscribe({
      next: (exceptions) => this.scheduleExceptions.set(exceptions),
      error: () => {} // Silent
    });
  }

  getActiveException(): ScheduleException | null {
    const startAtValue = this.appointmentForm?.get('startAt')?.value;
    if (!startAtValue) return null;

    const date = new Date(startAtValue);
    if (isNaN(date.getTime())) return null;

    const dateStr = date.toISOString().split('T')[0];
    const dentistId = this.appointmentForm?.get('userId')?.value || null;

    // Find the most relevant exception for this date
    return this.scheduleExceptions().find(ex => {
      if (ex.date !== dateStr) return false;
      // Clinic-wide exception applies to everyone
      if (!ex.userId) return true;
      // Dentist-specific exception applies only if matching
      if (dentistId && ex.userId === dentistId) return true;
      return false;
    }) || null;
  }

  getExceptionWarningMessage(): string {
    const ex = this.getActiveException();
    if (!ex) return '';
    const label = EXCEPTION_TYPE_LABELS[ex.type];
    const isClosed = ex.type !== 'modifiedHours';
    const scope = ex.userId ? `para ${ex.userName}` : 'para toda la clínica';
    if (isClosed) {
      return `${label} ${scope}: ${ex.reason}. No hay disponibilidad este día.`;
    }
    return `${label} ${scope}: ${ex.reason}. El horario está modificado (${ex.startTime} - ${ex.endTime}).`;
  }

  isOutsideWorkSchedule(): boolean {
    const days = this.workScheduleDays();
    if (days.length === 0) return false;

    const startAtValue = this.appointmentForm?.get('startAt')?.value;
    if (!startAtValue) return false;

    const startAt = new Date(startAtValue);
    if (isNaN(startAt.getTime())) return false;

    // Map JS day (0=Sun) to our day names
    const jsDay = startAt.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[jsDay];

    const daySchedule = days.find(d => d.dayOfWeek === dayName);
    if (!daySchedule) return false;
    if (!daySchedule.isOpen) return true;

    const hours = startAt.getHours().toString().padStart(2, '0');
    const minutes = startAt.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    return timeStr < daySchedule.startTime! || timeStr >= daySchedule.endTime!;
  }

  private loadContext(): void {
    const context = this.contextService.getCurrentContext();
    
    // Aplicar preselección de dentista
    if (context.preselectedDentistId && context.preselectedDentistName) {
      this.selectedDentist.set({
        id: context.preselectedDentistId,
        name: context.preselectedDentistName,
        specialization: context.preselectedDentistSpecialization || undefined
      });
      this.appointmentForm.patchValue({
        userId: context.preselectedDentistId
      });
    }

    // Aplicar preselección de paciente
    if (context.preselectedPatientId && context.preselectedPatientName) {
      this.selectedPatient.set({
        id: context.preselectedPatientId,
        name: context.preselectedPatientName,
        email: '',
        phone: ''
      });
      this.appointmentForm.patchValue({
        patientId: context.preselectedPatientId
      });
    }

    // Aplicar preselección de fechas (desde calendario)
    if (context.preselectedStartAt) {
      this.appointmentForm.patchValue({
        startAt: this.formatDateTimeLocal(context.preselectedStartAt)
      });
    }
    if (context.preselectedEndAt) {
      this.appointmentForm.patchValue({
        endAt: this.formatDateTimeLocal(context.preselectedEndAt)
      });
    }
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
      reason: ['', [Validators.required, Validators.minLength(3)]],
      locationId: [null]
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
      error: (err) => {
        this.logger.error('Error loading appointment:', err);
        this.error.set(getApiErrorMessage(err));
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
        error: (err) => {
          this.logger.error('Error updating appointment:', err);
          this.error.set(getApiErrorMessage(err));
          this.loading.set(false);
        }
      });
    } else {
      this.appointmentsService.create({
        patientId: formValue.patientId,
        userId: formValue.userId,
        locationId: formValue.locationId || undefined,
        startAt: startAt,
        endAt: endAt,
        reason: formValue.reason
      }).subscribe({
        next: () => {
          const returnUrl = this.contextService.getCurrentContext().returnUrl;
          this.contextService.resetContext();
          this.router.navigate([returnUrl]);
        },
        error: (err) => {
          this.logger.error('Error creating appointment:', err);
          this.error.set(getApiErrorMessage(err));
          this.loading.set(false);
        }
      });
    }
  }

  onCancel(): void {
    const returnUrl = this.contextService.getCurrentContext().returnUrl;
    this.contextService.resetContext();
    this.router.navigate([returnUrl]);
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
      // Load dentist-specific schedule for out-of-schedule warning
      this.settingsService.getDentistWorkSchedule(dentist.id).subscribe({
        next: (schedule) => this.workScheduleDays.set(schedule.days),
        error: () => this.loadWorkSchedule() // Fallback to clinic schedule
      });
    } else {
      this.appointmentForm.patchValue({ userId: '' });
      this.loadWorkSchedule(); // Reset to clinic schedule
    }
    this.availabilityChecked.set(false);
  }

  checkAvailability(): void {
    const formValue = this.appointmentForm.value;
    if (!formValue.userId || !formValue.startAt) return;

    const date = new Date(formValue.startAt);
    const startMs = new Date(formValue.startAt).getTime();
    const endMs = formValue.endAt ? new Date(formValue.endAt).getTime() : startMs + 3600000;
    const durationMin = Math.round((endMs - startMs) / 60000);

    this.checkingAvailability.set(true);
    this.availabilityChecked.set(false);

    this.appointmentsService.getAvailability(date, formValue.userId, durationMin, formValue.locationId).subscribe({
      next: (slots) => {
        this.availabilitySlots.set(slots);
        this.checkingAvailability.set(false);
        this.availabilityChecked.set(true);
      },
      error: (err) => {
        this.notifications.warning('No se pudo verificar disponibilidad');
        this.checkingAvailability.set(false);
      }
    });
  }

  selectSlot(slot: TimeSlot): void {
    this.appointmentForm.patchValue({
      startAt: this.formatDateTimeLocal(slot.start),
      endAt: this.formatDateTimeLocal(slot.end)
    });
  }

  formatSlotTime(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit', minute: '2-digit', hour12: false
    }).format(date);
  }
}
