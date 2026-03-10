import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { ModalComponentBase, ModalRef, ModalConfig } from '../../../../shared/services/modal.service';
import { PatientDiagnosesService } from '../../services/patient-diagnoses.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { FormSelectComponent } from '../../../../shared/components/form-select/form-select';
import { Cie10AutocompleteComponent } from '../../../../shared/components/cie10-autocomplete/cie10-autocomplete';
import { Cie10Code } from '../../../../core/services/cie10.service';
import { DIAGNOSIS_SEVERITIES } from '../../models/patient-diagnosis.models';

export interface DiagnosisFormModalData {
  patientId: string;
}

@Component({
  selector: 'app-diagnosis-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, Cie10AutocompleteComponent, FormSelectComponent],
  templateUrl: './diagnosis-form-modal.html',
  styleUrl: './diagnosis-form-modal.scss'
})
export class DiagnosisFormModalComponent implements ModalComponentBase<DiagnosisFormModalData, boolean> {
  private fb = inject(FormBuilder);
  private diagnosesService = inject(PatientDiagnosesService);
  private notifications = inject(NotificationService);

  modalData?: DiagnosisFormModalData;
  modalRef?: ModalRef<DiagnosisFormModalData, boolean>;
  modalConfig?: ModalConfig<DiagnosisFormModalData>;

  form!: FormGroup;
  loading = signal(false);
  selectedCie10Code = signal<string | null>(null);
  severityOptions = DIAGNOSIS_SEVERITIES;

  ngOnInit(): void {
    this.form = this.fb.group({
      description: ['', Validators.required],
      onsetDate: [''],
      severity: [''],
      notes: ['']
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const v = this.form.value;

    this.diagnosesService.create(this.modalData!.patientId, {
      description: v.description.trim(),
      cie10Code: this.selectedCie10Code() || undefined,
      onsetDate: v.onsetDate || undefined,
      severity: v.severity || undefined,
      notes: v.notes?.trim() || undefined
    }).subscribe({
      next: () => {
        this.notifications.success('Diagnóstico registrado');
        this.modalRef?.close(true);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  onCie10Selected(code: Cie10Code | null): void {
    this.selectedCie10Code.set(code?.code || null);
  }

  onClose(): void {
    this.modalRef?.close();
  }
}
