import { Component, OnInit, inject, signal, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LocationsService } from '../../services/locations.service';
import { LocationSelectorComponent } from '../../../../shared/components/location-selector/location-selector';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import {
  DaySchedule,
  WorkSchedule,
  DAY_LABELS,
  DAY_ORDER,
  DEFAULT_WORK_SCHEDULE,
  generateTimeOptions
} from '../../models/work-schedule.models';

@Component({
  selector: 'app-work-schedule-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, LocationSelectorComponent],
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

  schedule = signal<DaySchedule[]>([]);
  loading = signal(false);
  saving = signal(false);

  DAY_LABELS = DAY_LABELS;
  DAY_ORDER = DAY_ORDER;
  timeOptions = generateTimeOptions();

  ngOnInit(): void {
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
            endTime: isOpen ? '18:00' : null
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

  hasValidationError(day: DaySchedule): boolean {
    if (!day.isOpen) return false;
    if (!day.startTime || !day.endTime) return true;
    return day.startTime >= day.endTime;
  }

  isFormValid(): boolean {
    const days = this.schedule();
    if (!days.some(d => d.isOpen)) return false;
    return !days.some(d => this.hasValidationError(d));
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
