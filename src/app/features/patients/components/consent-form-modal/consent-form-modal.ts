import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { ModalComponentBase, ModalRef, ModalConfig } from '../../../../shared/services/modal.service';
import { InformedConsentsService } from '../../services/informed-consents.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { CONSENT_TYPES, getConsentTypeLabel } from '../../models/informed-consent.models';
import { ConsentTemplateService, ConsentTemplate } from '../../../settings/services/consent-template.service';

export interface ConsentFormModalData {
  patientId: string;
  appointmentId?: string;
  treatmentId?: string;
}

@Component({
  selector: 'app-consent-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './consent-form-modal.html',
  styleUrl: './consent-form-modal.scss'
})
export class ConsentFormModalComponent implements ModalComponentBase<ConsentFormModalData, boolean> {
  private fb = inject(FormBuilder);
  private consentsService = inject(InformedConsentsService);
  private templateService = inject(ConsentTemplateService);
  private notifications = inject(NotificationService);

  modalData?: ConsentFormModalData;
  modalRef?: ModalRef<ConsentFormModalData, boolean>;
  modalConfig?: ModalConfig<ConsentFormModalData>;

  form!: FormGroup;
  loading = signal(false);
  templates = signal<ConsentTemplate[]>([]);
  selectedTemplateId = signal<string | null>(null);

  CONSENT_TYPES = CONSENT_TYPES;
  getConsentTypeLabel = getConsentTypeLabel;

  ngOnInit(): void {
    this.form = this.fb.group({
      consentType: ['GeneralTreatment', Validators.required],
      title: ['', Validators.required],
      content: ['', Validators.required]
    });
  }

  loadTemplates(): void {
    if (this.templates().length > 0) return;
    this.templateService.getAll().subscribe({
      next: (data) => this.templates.set(data),
      error: () => {}
    });
  }

  onTemplateSelected(): void {
    const tplId = this.selectedTemplateId();
    if (!tplId) return;
    const tpl = this.templates().find(t => t.id === tplId);
    if (tpl) {
      this.form.patchValue({
        consentType: tpl.consentType,
        title: tpl.title,
        content: tpl.content
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const v = this.form.value;

    this.consentsService.create(this.modalData!.patientId, {
      consentType: v.consentType,
      title: v.title.trim(),
      content: v.content.trim(),
      appointmentId: this.modalData?.appointmentId || undefined,
      treatmentId: this.modalData?.treatmentId || undefined
    }).subscribe({
      next: () => {
        this.notifications.success('Consentimiento creado');
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
