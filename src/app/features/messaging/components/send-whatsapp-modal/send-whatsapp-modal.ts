import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { ModalComponentBase, ModalRef, ModalConfig } from '../../../../shared/services/modal.service';
import { MessagingService } from '../../services/messaging.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { WhatsAppTemplate } from '../../models/messaging.models';

export interface SendWhatsAppModalData {
  patientId: string;
  patientName: string;
  phoneNumber: string;
}

@Component({
  selector: 'app-send-whatsapp-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './send-whatsapp-modal.html',
  styleUrl: './send-whatsapp-modal.scss'
})
export class SendWhatsAppModalComponent implements ModalComponentBase<SendWhatsAppModalData, boolean>, OnInit {
  private messagingService = inject(MessagingService);
  private notifications = inject(NotificationService);

  modalData?: SendWhatsAppModalData;
  modalRef?: ModalRef<SendWhatsAppModalData, boolean>;
  modalConfig?: ModalConfig<SendWhatsAppModalData>;

  templates = signal<WhatsAppTemplate[]>([]);
  templatesLoading = signal(true);
  selectedTemplate = signal<WhatsAppTemplate | null>(null);
  sending = signal(false);

  // Template params filled by the user
  templateParams = signal<Record<string, string>>({});

  // Preview with replaced params
  previewMessage = signal('');

  ngOnInit(): void {
    this.loadTemplates();
  }

  private loadTemplates(): void {
    this.templatesLoading.set(true);
    this.messagingService.getTemplates().subscribe({
      next: (templates) => {
        this.templates.set(templates);
        this.templatesLoading.set(false);
      },
      error: () => {
        this.notifications.error('Error al cargar templates');
        this.templatesLoading.set(false);
      }
    });
  }

  selectTemplate(template: WhatsAppTemplate): void {
    this.selectedTemplate.set(template);

    // Pre-fill known params
    const params: Record<string, string> = {};
    for (const p of template.parameters) {
      if (p === 'patientName') {
        params[p] = this.modalData?.patientName || '';
      } else {
        params[p] = '';
      }
    }
    this.templateParams.set(params);
    this.updatePreview();
  }

  onParamChange(key: string, value: string): void {
    this.templateParams.update(params => ({ ...params, [key]: value }));
    this.updatePreview();
  }

  private updatePreview(): void {
    const tpl = this.selectedTemplate();
    if (!tpl) return;

    let preview = tpl.preview;
    const params = this.templateParams();
    for (const [key, value] of Object.entries(params)) {
      preview = preview.replace(new RegExp(`\\{${key}\\}`, 'g'), value || `{${key}}`);
    }
    this.previewMessage.set(preview);
  }

  getParamLabel(param: string): string {
    const labels: Record<string, string> = {
      patientName: 'Nombre del paciente',
      clinicName: 'Nombre del consultorio',
      date: 'Fecha',
      time: 'Hora',
      amount: 'Monto',
    };
    return labels[param] || param;
  }

  canSend(): boolean {
    const tpl = this.selectedTemplate();
    if (!tpl) return false;
    const params = this.templateParams();
    return tpl.parameters.every(p => !!params[p]?.trim());
  }

  onSend(): void {
    if (!this.canSend() || this.sending()) return;

    const tpl = this.selectedTemplate()!;
    this.sending.set(true);

    this.messagingService.sendWhatsApp({
      patientId: this.modalData!.patientId,
      templateName: tpl.name,
      templateParams: this.templateParams()
    }).subscribe({
      next: (result) => {
        if (result.success) {
          this.notifications.success('Mensaje de WhatsApp enviado correctamente');
          this.modalRef?.close(true);
        } else {
          this.notifications.error(result.errorMessage || 'Error al enviar mensaje');
          this.sending.set(false);
        }
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err, 'Error al enviar mensaje'));
        this.sending.set(false);
      }
    });
  }

  onClose(): void {
    this.modalRef?.close();
  }

  goBack(): void {
    this.selectedTemplate.set(null);
    this.templateParams.set({});
    this.previewMessage.set('');
  }
}
