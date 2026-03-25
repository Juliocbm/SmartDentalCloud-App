import { Component, inject, signal, computed, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { ModalComponentBase, ModalRef, ModalConfig } from '../../../../shared/services/modal.service';
import { NotificationTemplateService } from '../../services/notification-template.service';
import {
  NotificationTemplate,
  NOTIFICATION_TEMPLATE_TYPES,
  TEMPLATE_SYSTEM_VARIABLES,
} from '../../models/notification-template.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

export interface NotificationTemplateFormModalData {
  template?: NotificationTemplate;
  defaultChannel?: 'Email' | 'SMS';
}

@Component({
  selector: 'app-notification-template-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './notification-template-form-modal.html',
  styleUrl: './notification-template-form-modal.scss'
})
export class NotificationTemplateFormModalComponent implements ModalComponentBase<NotificationTemplateFormModalData, boolean>, OnInit {
  @ViewChild('bodyRef') bodyRef?: ElementRef<HTMLTextAreaElement>;

  private fb = inject(FormBuilder);
  private templateService = inject(NotificationTemplateService);
  private notifications = inject(NotificationService);

  modalData?: NotificationTemplateFormModalData;
  modalRef?: ModalRef<NotificationTemplateFormModalData, boolean>;
  modalConfig?: ModalConfig<NotificationTemplateFormModalData>;

  form!: FormGroup;
  loading = signal(false);

  readonly NOTIFICATION_TEMPLATE_TYPES = NOTIFICATION_TEMPLATE_TYPES;
  readonly TEMPLATE_SYSTEM_VARIABLES = TEMPLATE_SYSTEM_VARIABLES;

  isEdit = computed(() => !!this.modalData?.template);
  isWhatsApp = computed(() => this.modalData?.template?.channel === 'WhatsApp');
  isEmail = computed(() => {
    const t = this.modalData?.template;
    if (t) return t.channel === 'Email';
    return (this.modalData?.defaultChannel ?? 'Email') === 'Email';
  });

  ngOnInit(): void {
    const t = this.modalData?.template;
    const channel = t?.channel ?? (this.modalData?.defaultChannel ?? 'Email');

    this.form = this.fb.group({
      channel: [{ value: channel, disabled: !!t }, Validators.required],
      notificationType: [t?.notificationType ?? '', Validators.required],
      displayName: [t?.displayName ?? '', Validators.required],
      subject: [t?.subject ?? ''],
      bodyTemplate: [
        t?.bodyTemplate ?? '',
        this.isWhatsApp() ? [] : [Validators.required]
      ],
      isDefault: [t?.isDefault ?? false],
    });
  }

  /** Inserta una variable en el textarea de cuerpo en la posición del cursor */
  insertVariable(variable: string): void {
    const textarea = this.bodyRef?.nativeElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current: string = this.form.get('bodyTemplate')?.value ?? '';
    const newValue = current.substring(0, start) + variable + current.substring(end);

    this.form.patchValue({ bodyTemplate: newValue });

    // Restaurar foco y posición del cursor
    setTimeout(() => {
      textarea.focus();
      const newPos = start + variable.length;
      textarea.setSelectionRange(newPos, newPos);
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const v = this.form.getRawValue();
    const t = this.modalData?.template;

    if (this.isEdit()) {
      const payload = this.isWhatsApp()
        ? { notificationType: v.notificationType, displayName: v.displayName.trim(), isDefault: v.isDefault }
        : {
            notificationType: v.notificationType,
            displayName: v.displayName.trim(),
            subject: v.subject?.trim() || undefined,
            bodyTemplate: v.bodyTemplate.trim(),
            isDefault: v.isDefault,
          };

      this.templateService.update(t!.id, payload).subscribe({
        next: () => {
          this.notifications.success('Plantilla actualizada');
          this.modalRef?.close(true);
        },
        error: (err) => {
          this.notifications.error(getApiErrorMessage(err, 'Error al actualizar plantilla'));
          this.loading.set(false);
        }
      });
    } else {
      const payload = {
        channel: v.channel as 'Email' | 'SMS',
        notificationType: v.notificationType,
        displayName: v.displayName.trim(),
        subject: v.subject?.trim() || undefined,
        bodyTemplate: v.bodyTemplate.trim(),
        isDefault: v.isDefault,
      };

      this.templateService.create(payload).subscribe({
        next: () => {
          this.notifications.success('Plantilla creada');
          this.modalRef?.close(true);
        },
        error: (err) => {
          this.notifications.error(getApiErrorMessage(err, 'Error al crear plantilla'));
          this.loading.set(false);
        }
      });
    }
  }

  onClose(): void {
    this.modalRef?.close();
  }
}
