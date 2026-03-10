import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { ModalComponentBase, ModalRef, ModalConfig } from '../../../../shared/services/modal.service';
import { ConsentTemplateService, ConsentTemplate, CONSENT_TYPE_OPTIONS } from '../../services/consent-template.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { FormSelectComponent, SelectOption } from '../../../../shared/components/form-select/form-select';

export interface ConsentTemplateFormModalData {
  template?: ConsentTemplate;
}

@Component({
  selector: 'app-consent-template-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, FormSelectComponent],
  templateUrl: './consent-template-form-modal.html',
  styleUrl: './consent-template-form-modal.scss'
})
export class ConsentTemplateFormModalComponent implements ModalComponentBase<ConsentTemplateFormModalData, boolean> {
  private fb = inject(FormBuilder);
  private templateService = inject(ConsentTemplateService);
  private notifications = inject(NotificationService);

  modalData?: ConsentTemplateFormModalData;
  modalRef?: ModalRef<ConsentTemplateFormModalData, boolean>;
  modalConfig?: ModalConfig<ConsentTemplateFormModalData>;

  form!: FormGroup;
  loading = signal(false);
  isEdit = signal(false);

  CONSENT_TYPE_OPTIONS = CONSENT_TYPE_OPTIONS;

  ngOnInit(): void {
    const t = this.modalData?.template;
    this.isEdit.set(!!t);

    this.form = this.fb.group({
      consentType: [t?.consentType || 'GeneralTreatment', Validators.required],
      title: [t?.title || '', Validators.required],
      content: [t?.content || '', Validators.required],
      isDefault: [t?.isDefault || false]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const v = this.form.value;
    const payload = {
      consentType: v.consentType,
      title: v.title.trim(),
      content: v.content.trim(),
      isDefault: v.isDefault
    };

    const t = this.modalData?.template;
    const obs = t
      ? this.templateService.update(t.id, payload)
      : this.templateService.create(payload);

    obs.subscribe({
      next: () => {
        this.notifications.success(t ? 'Plantilla actualizada' : 'Plantilla creada');
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
