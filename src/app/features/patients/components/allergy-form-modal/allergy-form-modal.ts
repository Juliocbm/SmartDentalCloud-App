import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { ModalComponentBase, ModalRef, ModalConfig } from '../../../../shared/services/modal.service';
import { PatientAllergiesService } from '../../services/patient-allergies.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { FormSelectComponent } from '../../../../shared/components/form-select/form-select';
import { ALLERGEN_TYPES, ALLERGY_SEVERITIES } from '../../models/patient-allergy.models';

export interface AllergyFormModalData {
  patientId: string;
}

@Component({
  selector: 'app-allergy-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, FormSelectComponent],
  templateUrl: './allergy-form-modal.html',
  styleUrl: './allergy-form-modal.scss'
})
export class AllergyFormModalComponent implements ModalComponentBase<AllergyFormModalData, boolean> {
  private fb = inject(FormBuilder);
  private allergiesService = inject(PatientAllergiesService);
  private notifications = inject(NotificationService);

  modalData?: AllergyFormModalData;
  modalRef?: ModalRef<AllergyFormModalData, boolean>;
  modalConfig?: ModalConfig<AllergyFormModalData>;

  form!: FormGroup;
  loading = signal(false);

  ALLERGEN_TYPES = ALLERGEN_TYPES;
  ALLERGY_SEVERITIES = ALLERGY_SEVERITIES;

  ngOnInit(): void {
    this.form = this.fb.group({
      allergenType: ['Medication', Validators.required],
      allergenName: ['', Validators.required],
      severity: ['Mild', Validators.required],
      reactionDescription: [''],
      detectedAt: [''],
      notes: [''],
      verifiedByProfessional: [false]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const v = this.form.value;

    this.allergiesService.create(this.modalData!.patientId, {
      allergenType: v.allergenType,
      allergenName: v.allergenName.trim(),
      severity: v.severity,
      reactionDescription: v.reactionDescription?.trim() || undefined,
      detectedAt: v.detectedAt || undefined,
      verifiedByProfessional: v.verifiedByProfessional,
      notes: v.notes?.trim() || undefined
    }).subscribe({
      next: () => {
        this.notifications.success('Alergia registrada');
        this.modalRef?.close(true);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  onClose(): void {
    this.modalRef?.close();
  }
}
