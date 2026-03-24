import { Component, OnInit, inject, signal, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LocationsService } from '../../services/locations.service';
import { LocationAutocompleteComponent } from '../../../../shared/components/location-autocomplete/location-autocomplete';
import { LocationSummary } from '../../models/location.models';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import {
  DaySchedule,
  WorkSchedule,
  DAY_LABELS,
  DAY_ORDER,
  DEFAULT_WORK_SCHEDULE,
  generateTimeOptions,
  SLOT_DURATION_OPTIONS
} from '../../models/work-schedule.models';

@Component({
  selector: 'app-work-schedule-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, LocationAutocompleteComponent],
  templateUrl: './work-schedule-editor.html',
  styleUrl: './work-schedule-editor.scss'
})
export class WorkScheduleEditorComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private notifications = inject(NotificationService);
  locationsService = inject(LocationsService);

  selectedLocationId = signal<string | null>(null);

  /** User ID del dentista. Null/undefined = horario del consultorio */
  userId = input<string | null>(null);
  /** Título personalizado */
  title = input('Horario Laboral');
  /** Descripción personalizada */
  description = input('Configura los días y horarios de atención del consultorio');
  /** Mostrar u ocultar el header (título + descripción) */
  showHeader = input(true);
  /** Mostrar u ocultar el selector de ubicación interno */
  showLocationSelector = input(true);
  /** LocationId externo (cuando showLocationSelector=false) */
  locationId = input<string | null>(null);

  schedule = signal<DaySchedule[]>([]);
  loading = signal(false);
  saving = signal(false);

  DAY_LABELS = DAY_LABELS;
  DAY_ORDER = DAY_ORDER;
  timeOptions = generateTimeOptions();
  slotDurationOptions = SLOT_DURATION_OPTIONS;

  private locationEffect = effect(() => {
    const extLoc = this.locationId();
    if (!this.showLocationSelector()) {
      this.selectedLocationId.set(extLoc);
    }
  });

  ngOnInit(): void {
    this.loadSchedule();
  }

  onLocationSelected(location: LocationSummary | null): void {
    this.selectedLocationId.set(location?.id ?? null);
    this.loadSchedule();
  }

  loadSchedule(): void {
    this.loading.set(true);
    const uid = this.userId();
    const locId = this.selectedLocationId();
    const request$ = uid
      ? this.settingsService.getDentistWorkSchedule(uid, locId)
      : this.settingsService.getWorkSchedule(locId);

    request$.subscribe({
      next: (data) => {
        this.schedule.set(this.sortDays(data.days));
        this.loading.set(false);
      },
      error: () => {
        this.schedule.set([...DEFAULT_WORK_SCHEDULE.days]);
        this.loading.set(false);
      }
    });
  }

  toggleDay(dayOfWeek: string): void {
    this.schedule.update(days =>
      days.map(d => {
        if (d.dayOfWeek === dayOfWeek) {
          const isOpen = !d.isOpen;
          return {
            ...d,
            isOpen,
            startTime: isOpen ? '08:00' : null,
            endTime: isOpen ? '18:00' : null,
            lunchStartTime: isOpen ? d.lunchStartTime ?? '13:00' : null,
            lunchEndTime: isOpen ? d.lunchEndTime ?? '14:00' : null,
            slotDurationMinutes: isOpen ? d.slotDurationMinutes ?? 30 : null
          };
        }
        return d;
      })
    );
  }

  updateStartTime(dayOfWeek: string, value: string): void {
    this.schedule.update(days =>
      days.map(d => d.dayOfWeek === dayOfWeek ? { ...d, startTime: value } : d)
    );
  }

  updateEndTime(dayOfWeek: string, value: string): void {
    this.schedule.update(days =>
      days.map(d => d.dayOfWeek === dayOfWeek ? { ...d, endTime: value } : d)
    );
  }

  updateLunchStartTime(dayOfWeek: string, value: string): void {
    this.schedule.update(days =>
      days.map(d => d.dayOfWeek === dayOfWeek ? { ...d, lunchStartTime: value } : d)
    );
  }

  updateLunchEndTime(dayOfWeek: string, value: string): void {
    this.schedule.update(days =>
      days.map(d => d.dayOfWeek === dayOfWeek ? { ...d, lunchEndTime: value } : d)
    );
  }

  updateSlotDuration(dayOfWeek: string, value: number): void {
    this.schedule.update(days =>
      days.map(d => d.dayOfWeek === dayOfWeek ? { ...d, slotDurationMinutes: value } : d)
    );
  }

  hasValidationError(day: DaySchedule): boolean {
    if (!day.isOpen) return false;
    if (!day.startTime || !day.endTime) return true;
    if (day.startTime >= day.endTime) return true;
    if (day.lunchStartTime && day.lunchEndTime && day.lunchStartTime >= day.lunchEndTime) return true;
    if (day.lunchStartTime && !day.lunchEndTime) return true;
    if (!day.lunchStartTime && day.lunchEndTime) return true;
    return false;
  }

  hasLunchValidationError(day: DaySchedule): boolean {
    if (!day.isOpen) return false;
    if (!day.lunchStartTime || !day.lunchEndTime) return false;
    if (day.lunchStartTime >= day.lunchEndTime) return true;
    if (day.startTime && day.lunchStartTime < day.startTime) return true;
    if (day.endTime && day.lunchEndTime > day.endTime) return true;
    return false;
  }

  getSlotWarning(day: DaySchedule): string | null {
    if (!day.isOpen || !day.startTime || !day.endTime || !day.slotDurationMinutes) return null;
    const [startH, startM] = day.startTime.split(':').map(Number);
    const [endH, endM] = day.endTime.split(':').map(Number);
    const workMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    const lunchMinutes = day.lunchStartTime && day.lunchEndTime
      ? (() => {
          const [lsH, lsM] = day.lunchStartTime!.split(':').map(Number);
          const [leH, leM] = day.lunchEndTime!.split(':').map(Number);
          return (leH * 60 + leM) - (lsH * 60 + lsM);
        })()
      : 0;
    const availableMinutes = workMinutes - lunchMinutes;
    if (day.slotDurationMinutes > availableMinutes) {
      return `Duración del slot (${day.slotDurationMinutes} min) mayor al tiempo disponible (${availableMinutes} min)`;
    }
    return null;
  }

  isFormValid(): boolean {
    const days = this.schedule();
    if (!days.some(d => d.isOpen)) return false;
    return !days.some(d => this.hasValidationError(d) || this.hasLunchValidationError(d));
  }

  save(): void {
    if (this.saving() || !this.isFormValid()) return;
    this.saving.set(true);

    const uid = this.userId();
    const payload: WorkSchedule = {
      userId: uid,
      locationId: this.selectedLocationId(),
      days: this.schedule()
    };

    const request$ = uid
      ? this.settingsService.updateDentistWorkSchedule(uid, payload)
      : this.settingsService.updateWorkSchedule(payload);

    request$.subscribe({
      next: (data) => {
        this.schedule.set(this.sortDays(data.days));
        this.notifications.success('Horario laboral actualizado');
        this.saving.set(false);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
        this.saving.set(false);
      }
    });
  }

  private sortDays(days: DaySchedule[]): DaySchedule[] {
    return [...days].sort(
      (a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek)
    );
  }
}
