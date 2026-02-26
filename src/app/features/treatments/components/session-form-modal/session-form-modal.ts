import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { ModalComponentBase, ModalRef, ModalConfig } from '../../../../shared/services/modal.service';
import { TreatmentsService } from '../../services/treatments.service';
import { AppointmentsService } from '../../../appointments/services/appointments.service';
import { AppointmentListItem } from '../../../appointments/models/appointment.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { DatePickerComponent } from '../../../../shared/components/date-picker/date-picker';

export interface SessionFormModalData {
  treatmentId: string;
  patientId: string;
  nextSessionNumber: number;
}

@Component({
  selector: 'app-session-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, DatePickerComponent],
  templateUrl: './session-form-modal.html',
  styleUrl: './session-form-modal.scss'
})
export class SessionFormModalComponent implements ModalComponentBase<SessionFormModalData, boolean>, OnInit {
  private fb = inject(FormBuilder);
  private treatmentsService = inject(TreatmentsService);
  private appointmentsService = inject(AppointmentsService);
  private notifications = inject(NotificationService);

  modalData?: SessionFormModalData;
  modalRef?: ModalRef<SessionFormModalData, boolean>;
  modalConfig?: ModalConfig<SessionFormModalData>;

  form!: FormGroup;
  loading = signal(false);
  patientAppointments = signal<AppointmentListItem[]>([]);

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    this.form = this.fb.group({
      date: [today, Validators.required],
      duration: [null],
      appointmentId: [''],
      notes: ['']
    });

    this.loadPatientAppointments();
  }

  private loadPatientAppointments(): void {
    if (!this.modalData?.patientId) return;

    this.appointmentsService.getByPatient(this.modalData.patientId).subscribe({
      next: (data) => {
        const upcoming = data
          .filter(a => a.status === 'Scheduled' || a.status === 'Confirmed')
          .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
        this.patientAppointments.set(upcoming);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const formValue = this.form.value;

    this.treatmentsService.createSession(this.modalData!.treatmentId, {
      sessionNumber: this.modalData!.nextSessionNumber,
      date: new Date(formValue.date).toISOString(),
      appointmentId: formValue.appointmentId || undefined,
      duration: formValue.duration || undefined,
      notes: formValue.notes?.trim() || undefined
    }).subscribe({
      next: () => {
        this.notifications.success(`Sesión #${this.modalData!.nextSessionNumber} creada correctamente`);
        this.modalRef?.close(true);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err, 'Error al guardar sesión'));
        this.loading.set(false);
      }
    });
  }

  onClose(): void {
    this.modalRef?.close();
  }
}
