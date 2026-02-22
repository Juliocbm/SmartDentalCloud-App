import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { UsersService } from '../../../../core/services/users.service';
import { DentistListItem } from '../../../../core/models/user.models';
import {
  ScheduleException,
  ScheduleExceptionType,
  CreateScheduleExceptionRequest,
  UpdateScheduleExceptionRequest,
  EXCEPTION_TYPE_LABELS,
  EXCEPTION_TYPE_ICONS,
  EXCEPTION_TYPE_COLORS
} from '../../models/schedule-exception.models';
import { generateTimeOptions } from '../../models/work-schedule.models';

@Component({
  selector: 'app-schedule-exceptions-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schedule-exceptions-manager.html',
  styleUrl: './schedule-exceptions-manager.scss'
})
export class ScheduleExceptionsManagerComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private notifications = inject(NotificationService);
  private usersService = inject(UsersService);

  // Data
  exceptions = signal<ScheduleException[]>([]);
  dentists = signal<DentistListItem[]>([]);
  loading = signal(false);
  saving = signal(false);

  // Modal state
  showModal = signal(false);
  editingException = signal<ScheduleException | null>(null);

  // Form fields
  formDate = signal('');
  formType = signal<ScheduleExceptionType>('closedHoliday');
  formReason = signal('');
  formStartTime = signal('08:00');
  formEndTime = signal('14:00');
  formUserId = signal<string | null>(null);
  formIsRecurringYearly = signal(false);

  // Constants
  EXCEPTION_TYPE_LABELS = EXCEPTION_TYPE_LABELS;
  EXCEPTION_TYPE_ICONS = EXCEPTION_TYPE_ICONS;
  EXCEPTION_TYPE_COLORS = EXCEPTION_TYPE_COLORS;
  timeOptions = generateTimeOptions();

  exceptionTypes: { value: ScheduleExceptionType; label: string }[] = [
    { value: 'closedHoliday', label: 'Día Festivo' },
    { value: 'closedVacation', label: 'Vacaciones' },
    { value: 'closedOther', label: 'Cierre' },
    { value: 'modifiedHours', label: 'Horario Modificado' }
  ];

  ngOnInit(): void {
    this.loadExceptions();
    this.loadDentists();
  }

  loadExceptions(): void {
    this.loading.set(true);
    this.settingsService.getScheduleExceptions().subscribe({
      next: (data) => {
        this.exceptions.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.notifications.error('Error al cargar las excepciones de horario');
        this.loading.set(false);
      }
    });
  }

  private loadDentists(): void {
    this.usersService.getDentists().subscribe({
      next: (dentists) => this.dentists.set(dentists),
      error: () => this.dentists.set([])
    });
  }

  // === Modal ===

  openCreateModal(): void {
    this.editingException.set(null);
    this.formDate.set('');
    this.formType.set('closedHoliday');
    this.formReason.set('');
    this.formStartTime.set('08:00');
    this.formEndTime.set('14:00');
    this.formUserId.set(null);
    this.formIsRecurringYearly.set(false);
    this.showModal.set(true);
  }

  openEditModal(exception: ScheduleException): void {
    this.editingException.set(exception);
    this.formDate.set(exception.date);
    this.formType.set(exception.type);
    this.formReason.set(exception.reason);
    this.formStartTime.set(exception.startTime || '08:00');
    this.formEndTime.set(exception.endTime || '14:00');
    this.formUserId.set(exception.userId);
    this.formIsRecurringYearly.set(exception.isRecurringYearly);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingException.set(null);
  }

  isFormValid(): boolean {
    if (!this.formDate() || !this.formReason().trim()) return false;
    if (this.formType() === 'modifiedHours') {
      if (!this.formStartTime() || !this.formEndTime()) return false;
      if (this.formStartTime() >= this.formEndTime()) return false;
    }
    return true;
  }

  saveException(): void {
    if (this.saving() || !this.isFormValid()) return;
    this.saving.set(true);

    const editing = this.editingException();

    if (editing) {
      const request: UpdateScheduleExceptionRequest = {
        date: this.formDate(),
        type: this.formType(),
        reason: this.formReason().trim(),
        startTime: this.formType() === 'modifiedHours' ? this.formStartTime() : null,
        endTime: this.formType() === 'modifiedHours' ? this.formEndTime() : null,
        userId: this.formUserId(),
        isRecurringYearly: this.formIsRecurringYearly()
      };
      this.settingsService.updateScheduleException(editing.id, request).subscribe({
        next: () => {
          this.notifications.success('Excepción actualizada');
          this.closeModal();
          this.loadExceptions();
          this.saving.set(false);
        },
        error: () => {
          this.notifications.error('Error al actualizar la excepción');
          this.saving.set(false);
        }
      });
    } else {
      const request: CreateScheduleExceptionRequest = {
        date: this.formDate(),
        type: this.formType(),
        reason: this.formReason().trim(),
        startTime: this.formType() === 'modifiedHours' ? this.formStartTime() : null,
        endTime: this.formType() === 'modifiedHours' ? this.formEndTime() : null,
        userId: this.formUserId(),
        isRecurringYearly: this.formIsRecurringYearly()
      };
      this.settingsService.createScheduleException(request).subscribe({
        next: () => {
          this.notifications.success('Excepción creada');
          this.closeModal();
          this.loadExceptions();
          this.saving.set(false);
        },
        error: () => {
          this.notifications.error('Error al crear la excepción');
          this.saving.set(false);
        }
      });
    }
  }

  async deleteException(exception: ScheduleException): Promise<void> {
    const confirmed = await this.notifications.confirm(
      `¿Estás seguro de eliminar "${exception.reason}" del ${this.formatDate(exception.date)}?`
    );
    if (!confirmed) return;

    this.settingsService.deleteScheduleException(exception.id).subscribe({
      next: () => {
        this.notifications.success('Excepción eliminada');
        this.loadExceptions();
      },
      error: () => {
        this.notifications.error('Error al eliminar la excepción');
      }
    });
  }

  // === Helpers ===

  formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  getAppliesTo(exception: ScheduleException): string {
    return exception.userName || 'Clínica';
  }

  getTimeRange(exception: ScheduleException): string {
    if (exception.type === 'modifiedHours' && exception.startTime && exception.endTime) {
      return `${exception.startTime} - ${exception.endTime}`;
    }
    return 'Cerrado';
  }

  onUserIdChange(value: string): void {
    this.formUserId.set(value || null);
  }
}
