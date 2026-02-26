import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { ModalComponentBase, ModalRef, ModalConfig } from '../../../../shared/services/modal.service';
import { TreatmentsService } from '../../services/treatments.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

export interface FollowUpFormModalData {
  treatmentId: string;
}

@Component({
  selector: 'app-followup-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './followup-form-modal.html',
  styleUrl: './followup-form-modal.scss'
})
export class FollowUpFormModalComponent implements ModalComponentBase<FollowUpFormModalData, boolean> {
  private fb = inject(FormBuilder);
  private treatmentsService = inject(TreatmentsService);
  private notifications = inject(NotificationService);

  modalData?: FollowUpFormModalData;
  modalRef?: ModalRef<FollowUpFormModalData, boolean>;
  modalConfig?: ModalConfig<FollowUpFormModalData>;

  form!: FormGroup;
  loading = signal(false);

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    this.form = this.fb.group({
      date: [today, Validators.required],
      description: ['']
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const formValue = this.form.value;

    this.treatmentsService.createFollowUp(this.modalData!.treatmentId, {
      date: new Date(formValue.date).toISOString(),
      description: formValue.description?.trim() || undefined
    }).subscribe({
      next: () => {
        this.notifications.success('Seguimiento registrado correctamente');
        this.modalRef?.close(true);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err, 'Error al guardar seguimiento'));
        this.loading.set(false);
      }
    });
  }

  onClose(): void {
    this.modalRef?.close();
  }
}
