import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
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
import { DateFormatService } from '../../../../core/services/date-format.service';
import { SettingsService } from '../../../settings/services/settings.service';
import { DaySchedule } from '../../../settings/models/work-schedule.models';
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
    FormsModule,
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
  selectedLocationName = signal<string | null>(null);

  appointmentForm!: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  isEditMode = signal(false);
  appointmentId = signal<string | null>(null);

  selectedPatient = signal<PatientSearchResult | null>(null);
  selectedDentist = signal<DentistListItem | null>(null);

  // Slot-first mode
  selectedDate = signal<string | null>(null);
  duration = signal(30);
  selectedSlot = signal<TimeSlot | null>(null);
  manualMode = signal(false);
  slotsLoading = signal(false);
  slotsError = signal(false);
  availabilitySlots = signal<TimeSlot[]>([]);

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

  canLoadSlots = computed(() => !!this.selectedDentist() && !!this.selectedDate());

  canSubmit(): boolean {
    if (this.appointmentForm?.invalid) return false;
    if (this.manualMode()) return true;
    return !!this.selectedSlot();
  }

  constructor() {
    // Auto-load slots when dentist, date, or duration changes
    effect(() => {
      const dentist = this.selectedDentist();
      const date = this.selectedDate();
      const dur = this.duration();
      const locationId = this.selectedLocationId();
      const manual = this.manualMode();

      if (!manual && dentist && date) {
        this.loadSlots();
      }
    });
  }

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
      error: () => {}
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
      error: () => {}
    });
  }

  getActiveException(): ScheduleException | null {
    const dateStr = this.manualMode()
      ? (() => {
          const val = this.appointmentForm?.get('startAt')?.value;
          if (!val) return null;
          const d = new Date(val);
          return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
        })()
      : this.selectedDate();

    if (!dateStr) return null;
    const dentistId = this.appointmentForm?.get('userId')?.value || null;

    return this.scheduleExceptions().find(ex => {
      if (ex.date !== dateStr) return false;
      if (!ex.userId) return true;
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

    if (context.preselectedDentistId && context.preselectedDentistName) {
      this.selectedDentist.set({
        id: context.preselectedDentistId,
        name: context.preselectedDentistName,
        specialization: context.preselectedDentistSpecialization || undefined
      });
      this.appointmentForm.patchValue({ userId: context.preselectedDentistId });

      // Load dentist-specific schedule
      this.settingsService.getDentistWorkSchedule(context.preselectedDentistId).subscribe({
        next: (schedule) => this.workScheduleDays.set(schedule.days),
        error: () => this.loadWorkSchedule()
      });
    }

    if (context.preselectedPatientId && context.preselectedPatientName) {
      this.selectedPatient.set({
        id: context.preselectedPatientId,
        name: context.preselectedPatientName,
        email: '',
        phone: ''
      });
      this.appointmentForm.patchValue({ patientId: context.preselectedPatientId });
    }

    if (context.preselectedLocationId && context.preselectedLocationName) {
      this.selectedLocationId.set(context.preselectedLocationId);
      this.selectedLocationName.set(context.preselectedLocationName);
      this.appointmentForm.patchValue({ locationId: context.preselectedLocationId });
    }

    // Calendar context: extract date and duration, auto-select matching slot
    if (context.preselectedStartAt) {
      const start = new Date(context.preselectedStartAt);
      const dateStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
      this.selectedDate.set(dateStr);

      if (context.preselectedEndAt) {
        const end = new Date(context.preselectedEndAt);
        const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);
        if ([15, 20, 30, 45, 60, 90, 120].includes(durationMin)) {
          this.duration.set(durationMin);
        }
      }

      // Also set form values for manual mode fallback
      this.appointmentForm.patchValue({
        startAt: this.formatDateTimeLocal(start)
      });
      if (context.preselectedEndAt) {
        this.appointmentForm.patchValue({
          endAt: this.formatDateTimeLocal(new Date(context.preselectedEndAt))
        });
      }
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
          reason: appointment.reason,
          locationId: appointment.locationId || null
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

        if (appointment.locationId && appointment.locationName) {
          this.selectedLocationId.set(appointment.locationId);
          this.selectedLocationName.set(appointment.locationName);
        }

        // Pre-fill slot-first mode from existing appointment
        const start = new Date(appointment.startAt);
        const end = new Date(appointment.endAt);
        const dateStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
        this.selectedDate.set(dateStr);

        const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);
        if ([15, 20, 30, 45, 60, 90, 120].includes(durationMin)) {
          this.duration.set(durationMin);
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

  // ===== Slot-first mode methods =====

  onDateChange(date: string | null): void {
    this.selectedDate.set(date);
    this.selectedSlot.set(null);
  }

  onDurationChange(duration: number): void {
    this.duration.set(Number(duration));
    this.selectedSlot.set(null);
  }

  loadSlots(): void {
    const dateStr = this.selectedDate();
    const dentist = this.selectedDentist();
    if (!dateStr || !dentist) return;

    const date = new Date(dateStr + 'T00:00:00');
    this.slotsLoading.set(true);
    this.slotsError.set(false);
    this.selectedSlot.set(null);

    this.appointmentsService.getAvailability(
      date,
      dentist.id,
      this.duration(),
      this.selectedLocationId()
    ).subscribe({
      next: (slots) => {
        this.availabilitySlots.set(slots);
        this.slotsLoading.set(false);

        // Auto-select slot if coming from calendar context
        this.autoSelectSlotFromContext(slots);
      },
      error: () => {
        this.slotsError.set(true);
        this.slotsLoading.set(false);
        this.availabilitySlots.set([]);
      }
    });
  }

  private autoSelectSlotFromContext(slots: TimeSlot[]): void {
    const context = this.contextService.getCurrentContext();
    if (!context.preselectedStartAt) return;

    const preStart = new Date(context.preselectedStartAt);
    const match = slots.find(s =>
      s.available &&
      s.start.getHours() === preStart.getHours() &&
      s.start.getMinutes() === preStart.getMinutes()
    );

    if (match) {
      this.selectSlot(match);
    }
  }

  selectSlot(slot: TimeSlot): void {
    if (!slot.available) return;
    this.selectedSlot.set(slot);
    this.appointmentForm.patchValue({
      startAt: this.formatDateTimeLocal(slot.start),
      endAt: this.formatDateTimeLocal(slot.end)
    });
  }

  isSlotSelected(slot: TimeSlot): boolean {
    const selected = this.selectedSlot();
    if (!selected) return false;
    return selected.start.getTime() === slot.start.getTime();
  }

  switchToSlotMode(): void {
    this.manualMode.set(false);
    this.selectedSlot.set(null);
    if (this.canLoadSlots()) {
      this.loadSlots();
    }
  }

  onLocationSelected(event: { id: string; name: string } | null): void {
    if (event) {
      this.selectedLocationId.set(event.id);
      this.selectedLocationName.set(event.name);
      this.appointmentForm.patchValue({ locationId: event.id });
    } else {
      this.selectedLocationId.set(null);
      this.selectedLocationName.set(null);
      this.appointmentForm.patchValue({ locationId: null });
    }
  }

  formatSlotTime(date: Date): string {
    return DateFormatService.timeOnly(date);
  }

  // ===== Form methods =====

  async onSubmit(): Promise<void> {
    if (!this.canSubmit()) {
      this.appointmentForm.markAllAsTouched();
      return;
    }

    // In slot mode, ensure form has the slot values
    if (!this.manualMode() && this.selectedSlot()) {
      this.appointmentForm.patchValue({
        startAt: this.formatDateTimeLocal(this.selectedSlot()!.start),
        endAt: this.formatDateTimeLocal(this.selectedSlot()!.end)
      });
    }

    // Confirmation if outside work schedule or exception active (manual mode only)
    if (this.manualMode()) {
      const outsideSchedule = this.isOutsideWorkSchedule();
      const activeException = this.getActiveException();
      if (outsideSchedule || activeException) {
        const confirmMessage = this.buildOutOfHoursConfirmMessage(activeException);
        const confirmed = await this.notifications.confirm(confirmMessage, {
          title: 'Cita fuera de horario',
          confirmText: 'Crear de todas formas',
          cancelText: 'Cancelar',
          type: 'warning'
        });
        if (!confirmed) return;
      }
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
          this.notifications.success('Cita reagendada correctamente.');
          this.router.navigate(['/appointments']);
        },
        error: (err) => {
          this.logger.error('Error updating appointment:', err);
          this.notifications.error(getApiErrorMessage(err));
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
          this.notifications.success('Cita creada correctamente.');
          const returnUrl = this.contextService.getCurrentContext().returnUrl;
          this.contextService.resetContext();
          this.router.navigate([returnUrl]);
        },
        error: (err) => {
          this.logger.error('Error creating appointment:', err);
          this.notifications.error(getApiErrorMessage(err));
          this.loading.set(false);
        }
      });
    }
  }

  private buildOutOfHoursConfirmMessage(exception: ScheduleException | null): string {
    if (exception) {
      const warningMsg = this.getExceptionWarningMessage();
      return `${warningMsg}\n\nLa cita se creará de forma excepcional y funcionará con normalidad, pero estará fuera de la programación regular.`;
    }
    return 'Esta cita está fuera del horario laboral configurado.\n\nLa cita se creará de forma excepcional y funcionará con normalidad, pero estará fuera de la programación regular.';
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
      this.settingsService.getDentistWorkSchedule(dentist.id).subscribe({
        next: (schedule) => this.workScheduleDays.set(schedule.days),
        error: () => this.loadWorkSchedule()
      });
    } else {
      this.appointmentForm.patchValue({ userId: '' });
      this.loadWorkSchedule();
    }
    this.selectedSlot.set(null);
  }
}
