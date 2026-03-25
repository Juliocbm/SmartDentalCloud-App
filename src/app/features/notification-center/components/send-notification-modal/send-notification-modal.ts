import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { ModalComponentBase, ModalRef } from '../../../../shared/services/modal.service';
import { PatientAutocompleteComponent } from '../../../../shared/components/patient-autocomplete/patient-autocomplete';
import { PatientSearchResult } from '../../../patients/models/patient.models';
import { NotificationCenterService } from '../../services/notification-center.service';
import { CreateNotificationRequest } from '../../models/notification-center.models';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

@Component({
  selector: 'app-send-notification-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, PatientAutocompleteComponent],
  templateUrl: './send-notification-modal.html',
  styleUrl: './send-notification-modal.scss'
})
export class SendNotificationModalComponent implements ModalComponentBase<unknown, boolean> {
  modalData?: unknown;
  modalRef?: ModalRef<unknown, boolean>;

  private service = inject(NotificationCenterService);

  // Patient selection
  selectedPatient = signal<PatientSearchResult | null>(null);

  // Form state
  channel = signal('Email');
  subject = signal('');
  messageBody = signal('');
  priority = signal(0);

  sending = signal(false);
  error = signal<string | null>(null);

  onPatientSelected(patient: PatientSearchResult | null): void {
    this.selectedPatient.set(patient);
  }

  close(): void {
    this.modalRef?.close();
  }

  send(): void {
    this.error.set(null);

    const patient = this.selectedPatient();
    if (!patient) {
      this.error.set('Debe seleccionar un paciente');
      return;
    }

    // Validar que el paciente tenga el dato de contacto necesario según el canal
    if (this.channel() === 'Email' && !patient.email) {
      this.error.set('El paciente seleccionado no tiene email registrado');
      return;
    }

    if (this.channel() === 'WhatsApp' && !patient.phone) {
      this.error.set('El paciente seleccionado no tiene teléfono registrado');
      return;
    }

    if (!this.messageBody()) {
      this.error.set('El mensaje es requerido');
      return;
    }

    const request: CreateNotificationRequest = {
      channel: this.channel(),
      patientId: patient.id,
      messageBody: this.messageBody(),
      priority: this.priority(),
    };

    if (this.channel() === 'Email') {
      request.recipientEmail = patient.email;
      request.subject = this.subject();
    } else {
      request.recipientPhone = patient.phone;
    }

    this.sending.set(true);
    this.service.createManual(request).subscribe({
      next: () => {
        this.modalRef?.close(true);
      },
      error: (err) => {
        this.error.set(getApiErrorMessage(err, 'Error al crear la notificación'));
        this.sending.set(false);
      }
    });
  }
}
