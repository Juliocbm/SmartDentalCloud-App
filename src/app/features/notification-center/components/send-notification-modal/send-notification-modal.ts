import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { ModalComponentBase, ModalRef } from '../../../../shared/services/modal.service';
import { PatientAutocompleteComponent } from '../../../../shared/components/patient-autocomplete/patient-autocomplete';
import { PatientSearchResult } from '../../../patients/models/patient.models';
import { NotificationCenterService } from '../../services/notification-center.service';
import { CreateNotificationRequest } from '../../models/notification-center.models';
import { MessagingService } from '../../../messaging/services/messaging.service';
import { WhatsAppTemplate } from '../../../messaging/models/messaging.models';
import { NotificationTemplateService } from '../../../settings/services/notification-template.service';
import { NotificationTemplate } from '../../../settings/models/notification-template.models';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { FeatureService } from '../../../../core/services/feature.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-send-notification-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, PatientAutocompleteComponent, EmptyStateComponent],
  templateUrl: './send-notification-modal.html',
  styleUrl: './send-notification-modal.scss'
})
export class SendNotificationModalComponent implements ModalComponentBase<unknown, boolean>, OnInit {
  modalData?: unknown;
  modalRef?: ModalRef<unknown, boolean>;

  private service = inject(NotificationCenterService);
  private messagingService = inject(MessagingService);
  private notificationTemplateService = inject(NotificationTemplateService);
  featureService = inject(FeatureService);

  hasWhatsApp = computed(() => this.featureService.hasFeature('WhatsAppMessaging'));

  // Selección de paciente
  selectedPatient = signal<PatientSearchResult | null>(null);

  // Formulario base
  channel = signal('Email');
  subject = signal('');
  messageBody = signal('');
  priority = signal(0);

  // Templates WhatsApp / SMS (Twilio)
  templates = signal<WhatsAppTemplate[]>([]);
  templatesLoading = signal(false);
  templatesLoaded = signal(false);
  selectedTemplate = signal<WhatsAppTemplate | null>(null);
  templateParams = signal<Record<string, string>>({});
  previewMessage = signal('');
  private clinicName = signal('Consultorio');

  // Templates Email (DB)
  emailTemplates = signal<NotificationTemplate[]>([]);
  emailTemplatesLoading = signal(false);
  emailTemplatesLoaded = signal(false);
  selectedEmailTemplate = signal<NotificationTemplate | null>(null);
  skipEmailTemplate = signal(false);
  emailTemplateParams = signal<Record<string, string>>({});

  sending = signal(false);
  error = signal<string | null>(null);

  // Canal que requiere template aprobado (WhatsApp o SMS)
  isTemplateChannel = computed(() =>
    this.channel() === 'WhatsApp' || this.channel() === 'SMS'
  );

  // Email: mostrar paso de selección de plantilla
  showEmailTemplateStep = computed(() =>
    this.channel() === 'Email' &&
    this.emailTemplates().length > 0 &&
    !this.selectedEmailTemplate() &&
    !this.skipEmailTemplate()
  );

  // Variables que el usuario debe rellenar en el template de email
  emailUserParameters = computed(() => {
    const tpl = this.selectedEmailTemplate();
    if (!tpl) return [];
    const allVars = new Set([
      ...this.extractTemplateVars(tpl.subject),
      ...this.extractTemplateVars(tpl.bodyTemplate),
    ]);
    const systemSet = new Set(['patientName', 'clinicName', ...(tpl.systemParameters ?? [])]);
    return [...allVars].filter(v => !systemSet.has(v));
  });

  // Vista previa resuelta del email seleccionado
  emailPreview = computed(() => {
    const tpl = this.selectedEmailTemplate();
    if (!tpl) return null;
    const patient = this.selectedPatient();
    const params = this.emailTemplateParams();
    const resolve = (text: string | null) => {
      if (!text) return '';
      return text
        .replace(/\{\{patientName\}\}/g, patient?.name ?? '')
        .replace(/\{\{clinicName\}\}/g, this.clinicName())
        .replace(/\{\{(\w+)\}\}/g, (_, key) => this.formatParamValue(key, params[key] ?? '') || `{{${key}}}`);
    };
    return { subject: resolve(tpl.subject), body: resolve(tpl.bodyTemplate) };
  });

  // Solo parámetros que el usuario debe rellenar (excluye los de sistema)
  userParameters = computed(() => {
    const tpl = this.selectedTemplate();
    if (!tpl) return [];
    const systemSet = new Set(tpl.systemParameters ?? []);
    return tpl.parameters.filter(p => !systemSet.has(p));
  });

  ngOnInit(): void {
    this.messagingService.getClinicInfo().subscribe({
      next: (info) => this.clinicName.set(info.clinicName),
      error: () => {}
    });
    this.loadEmailTemplates();
  }

  onPatientSelected(patient: PatientSearchResult | null): void {
    this.selectedPatient.set(patient);
    if (this.selectedTemplate()) {
      this.updatePreview();
    }
  }

  onChannelChange(newChannel: string): void {
    this.channel.set(newChannel);
    this.selectedTemplate.set(null);
    this.templateParams.set({});
    this.previewMessage.set('');
    this.selectedEmailTemplate.set(null);
    this.skipEmailTemplate.set(false);
    this.error.set(null);

    if ((newChannel === 'WhatsApp' || newChannel === 'SMS') && !this.templatesLoaded()) {
      this.loadTemplates();
    }
  }

  // ── WhatsApp / SMS ──────────────────────────────────────────────────────────

  private loadTemplates(): void {
    this.templatesLoading.set(true);
    this.messagingService.getTemplates().subscribe({
      next: (templates) => {
        this.templates.set(templates);
        this.templatesLoading.set(false);
        this.templatesLoaded.set(true);
      },
      error: () => {
        this.error.set('No se pudieron cargar los templates. Intente de nuevo.');
        this.templatesLoading.set(false);
      }
    });
  }

  selectTemplate(template: WhatsAppTemplate): void {
    this.selectedTemplate.set(template);
    const systemSet = new Set(template.systemParameters ?? []);
    const params: Record<string, string> = {};
    for (const p of template.parameters) {
      if (!systemSet.has(p)) params[p] = '';
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
    const patient = this.selectedPatient();

    const systemValues: Record<string, string> = {
      patientName: patient?.name ?? '',
      clinicName: this.clinicName(),
    };
    for (const [key, value] of Object.entries(systemValues)) {
      preview = preview.replace(new RegExp(`\\{${key}\\}`, 'g'), value || `{${key}}`);
    }
    for (const [key, value] of Object.entries(params)) {
      preview = preview.replace(new RegExp(`\\{${key}\\}`, 'g'), this.formatParamValue(key, value) || `{${key}}`);
    }

    this.previewMessage.set(preview);
  }

  goBack(): void {
    this.selectedTemplate.set(null);
    this.templateParams.set({});
    this.previewMessage.set('');
    this.error.set(null);
  }

  // ── Email ───────────────────────────────────────────────────────────────────

  private extractTemplateVars(text: string | null): string[] {
    if (!text) return [];
    return [...text.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]);
  }

  private loadEmailTemplates(): void {
    this.emailTemplatesLoading.set(true);
    this.notificationTemplateService.getAll('Email').subscribe({
      next: (templates) => {
        this.emailTemplates.set(templates);
        this.emailTemplatesLoading.set(false);
        this.emailTemplatesLoaded.set(true);
      },
      error: () => {
        this.emailTemplatesLoading.set(false);
        this.emailTemplatesLoaded.set(true);
      }
    });
  }

  selectEmailTemplate(template: NotificationTemplate): void {
    this.selectedEmailTemplate.set(template);
    this.emailTemplateParams.set({});
  }

  goBackEmailTemplate(): void {
    this.selectedEmailTemplate.set(null);
    this.skipEmailTemplate.set(false);
    this.emailTemplateParams.set({});
    this.subject.set('');
    this.messageBody.set('');
    this.error.set(null);
  }

  onEmailParamChange(key: string, value: string): void {
    this.emailTemplateParams.update(p => ({ ...p, [key]: value }));
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private readonly PARAM_INPUT_CONFIG: Record<string, { type: string; step?: string; min?: string }> = {
    date:            { type: 'date' },
    appointmentDate: { type: 'date' },
    time:            { type: 'time' },
    appointmentTime: { type: 'time' },
    amount:          { type: 'number', step: '0.01', min: '0' },
  };

  getParamLabel(param: string): string {
    const labels: Record<string, string> = {
      date:            'Fecha',
      appointmentDate: 'Fecha de cita',
      time:            'Hora',
      appointmentTime: 'Hora de cita',
      amount:          'Monto',
    };
    return labels[param] || param;
  }

  getParamInputType(param: string): string {
    return this.PARAM_INPUT_CONFIG[param]?.type ?? 'text';
  }

  getParamInputAttrs(param: string): { step?: string; min?: string } {
    const cfg = this.PARAM_INPUT_CONFIG[param];
    return cfg ? { step: cfg.step, min: cfg.min } : {};
  }

  private formatParamValue(param: string, value: string): string {
    if (!value) return '';
    if ((param === 'date' || param === 'appointmentDate') && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-');
      return `${d}/${m}/${y}`;
    }
    return value;
  }

  canSend(): boolean {
    if (!this.selectedPatient()) return false;
    if (this.isTemplateChannel()) {
      const tpl = this.selectedTemplate();
      if (!tpl) return false;
      return this.userParameters().every(p => !!this.templateParams()[p]?.trim());
    }
    if (this.showEmailTemplateStep()) return false;
    if (this.selectedEmailTemplate()) {
      return this.emailUserParameters().every(p => !!this.emailTemplateParams()[p]?.trim());
    }
    return !!this.messageBody().trim();
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

    if (this.isTemplateChannel()) {
      if (!patient.phone) {
        this.error.set('El paciente seleccionado no tiene teléfono registrado');
        return;
      }
      const tpl = this.selectedTemplate();
      if (!tpl) {
        this.error.set('Debe seleccionar un template');
        return;
      }
      const missingParam = this.userParameters().find(p => !this.templateParams()[p]?.trim());
      if (missingParam) {
        this.error.set(`Complete el campo "${this.getParamLabel(missingParam)}"`);
        return;
      }

      const rawParams = this.templateParams();
      const formattedParams: Record<string, string> = {};
      for (const [key, value] of Object.entries(rawParams)) {
        formattedParams[key] = this.formatParamValue(key, value);
      }

      const request: CreateNotificationRequest = {
        channel: this.channel(),
        patientId: patient.id,
        recipientPhone: patient.phone,
        templateName: tpl.name,
        templateParameters: formattedParams,
        priority: this.priority(),
      };

      this.sending.set(true);
      this.service.createManual(request).subscribe({
        next: () => this.modalRef?.close(true),
        error: (err) => {
          this.error.set(getApiErrorMessage(err, 'Error al crear la notificación'));
          this.sending.set(false);
        }
      });

    } else {
      if (!patient.email) {
        this.error.set('El paciente seleccionado no tiene email registrado');
        return;
      }
      const preview = this.emailPreview();
      if (!preview && !this.messageBody().trim()) {
        this.error.set('El mensaje es requerido');
        return;
      }
      const request: CreateNotificationRequest = {
        channel: 'Email',
        patientId: patient.id,
        recipientEmail: patient.email,
        subject: preview ? preview.subject : this.subject(),
        messageBody: preview ? preview.body : this.messageBody(),
        priority: this.priority(),
      };

      this.sending.set(true);
      this.service.createManual(request).subscribe({
        next: () => this.modalRef?.close(true),
        error: (err) => {
          this.error.set(getApiErrorMessage(err, 'Error al crear la notificación'));
          this.sending.set(false);
        }
      });
    }
  }
}
