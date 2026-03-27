import { Component, OnInit, signal, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { WorkScheduleEditorComponent } from '../work-schedule-editor/work-schedule-editor';
import { DentistScheduleManagerComponent } from '../dentist-schedule-manager/dentist-schedule-manager';
import { ScheduleExceptionsManagerComponent } from '../schedule-exceptions-manager/schedule-exceptions-manager';
import { LocationListComponent } from '../location-list/location-list';
import { ConsentTemplateListComponent } from '../consent-template-list/consent-template-list';
import { NotificationTemplateListComponent } from '../notification-template-list/notification-template-list';
import { ImageUploadComponent } from '../../../../shared/components/image-upload/image-upload';
import { SettingsService } from '../../services/settings.service';
import { CfdiService } from '../../../invoices/services/cfdi.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { NavigationStateService } from '../../../../core/services/navigation-state.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { FormSelectComponent } from '../../../../shared/components/form-select/form-select';
import { InputFormatDirective } from '../../../../shared/directives/input-format.directive';
import {
  TenantSettings,
  SmtpConfiguration,
  ConfigureSmtpRequest,
  TestSmtpRequest,
  TIMEZONE_OPTIONS,
  LANGUAGE_OPTIONS
} from '../../models/settings.models';
import {
  CsdCertificate,
  CsdStatus
} from '../../../invoices/models/cfdi.models';
import { MessagingService } from '../../../messaging/services/messaging.service';
import { NotificationSettingsService } from '../../services/notification-settings.service';
import {
  NotificationSettings,
  NotificationChannelSettings,
  NotificationTypeSettings,
  REMINDER_HOURS_OPTIONS,
  POST_TREATMENT_DAYS_OPTIONS
} from '../../models/notification-settings.models';
import { NotificationTemplateService } from '../../services/notification-template.service';
import { NotificationTemplate } from '../../models/notification-template.models';

type SettingsTab = 'general' | 'locations' | 'schedule' | 'dentist-schedule' | 'exceptions' | 'consent-templates' | 'notification-templates' | 'facturacion' | 'smtp' | 'notifications' | 'branding' | 'domain' | 'inventory-alerts';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, WorkScheduleEditorComponent, DentistScheduleManagerComponent, ScheduleExceptionsManagerComponent, LocationListComponent, ConsentTemplateListComponent, NotificationTemplateListComponent, ImageUploadComponent, FormSelectComponent, InputFormatDirective],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss'
})
export class SettingsPageComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private cfdiService = inject(CfdiService);
  private messagingService = inject(MessagingService);
  private notifications = inject(NotificationService);
  private navigationState = inject(NavigationStateService);
  private router = inject(Router);
  private notificationService = inject(NotificationSettingsService);
  private notificationTemplateService = inject(NotificationTemplateService);

  scheduleEditor = viewChild<WorkScheduleEditorComponent>('scheduleEditor');
  dentistScheduleManager = viewChild<DentistScheduleManagerComponent>('dentistScheduleManager');
  exceptionsManager = viewChild<ScheduleExceptionsManagerComponent>('exceptionsManager');

  // State
  settings = signal<TenantSettings | null>(null);
  smtpConfig = signal<SmtpConfiguration | null>(null);
  loading = signal(false);
  saving = signal(false);
  activeTab = signal<SettingsTab>('general');

  // General form
  generalName = signal('');
  generalLegalName = signal('');
  generalTaxId = signal('');
  generalAddress = signal('');
  generalPostalCode = signal('');
  generalRegimenFiscal = signal('');
  generalPhone = signal('');
  generalEmail = signal('');
  generalWorkingHours = signal('');
  generalTimeZone = signal('');
  generalLanguage = signal('');
  generalClues = signal('');

  // SMTP form
  smtpHost = signal('');
  smtpPort = signal(587);
  smtpUsername = signal('');
  smtpPassword = signal('');
  smtpFromEmail = signal('');
  smtpFromName = signal('');
  smtpUseSsl = signal(true);
  smtpTesting = signal(false);
  smtpTestResult = signal<{ success: boolean; message: string } | null>(null);

  // CSD (Certificado de Sello Digital)
  csdStatus = signal<CsdStatus | null>(null);
  csdLoading = signal(false);
  csdUploading = signal(false);
  csdCerFile = signal<File | null>(null);
  csdKeyFile = signal<File | null>(null);
  csdKeyPassword = signal('');
  csdValidating = signal(false);
  csdValidationMessage = signal<{ success: boolean; message: string } | null>(null);

  // Branding form
  brandingLogoUrl = signal('');

  // Domain form
  domainCustom = signal('');

  // Inventory Alerts form
  alertLowStockEnabled = signal(true);
  alertExpiryEnabled = signal(true);
  alertReorderEnabled = signal(true);
  alertExpiryDays = signal(30);
  alertLowStockPercent = signal(20);
  alertNotifyEmail = signal(true);
  alertNotifyInApp = signal(true);
  alertEmailList = signal('');
  alertLoading = signal(false);
  alertSaving = signal(false);

  // Constants
  TIMEZONE_OPTIONS = TIMEZONE_OPTIONS;
  LANGUAGE_OPTIONS = LANGUAGE_OPTIONS;

  tabs: { key: SettingsTab; label: string; icon: string }[] = [
    { key: 'general', label: 'General', icon: 'fa-gear' },
    { key: 'locations', label: 'Sucursales', icon: 'fa-location-dot' },
    { key: 'schedule', label: 'Horario', icon: 'fa-clock' },
    { key: 'dentist-schedule', label: 'Horarios Dentistas', icon: 'fa-user-doctor' },
    { key: 'exceptions', label: 'Excepciones', icon: 'fa-calendar-xmark' },
    { key: 'consent-templates', label: 'Consentimientos', icon: 'fa-file-contract' },
    { key: 'notification-templates', label: 'Plantillas Notificación', icon: 'fa-bells' },
    { key: 'facturacion', label: 'Facturación', icon: 'fa-file-invoice-dollar' },
    { key: 'smtp', label: 'Correo (SMTP)', icon: 'fa-envelope' },
    { key: 'notifications', label: 'Notificaciones', icon: 'fa-bell' },
    { key: 'branding', label: 'Branding', icon: 'fa-palette' },
    { key: 'domain', label: 'Dominio', icon: 'fa-globe' },
    { key: 'inventory-alerts', label: 'Alertas Inventario', icon: 'fa-bell' }
  ];

  ngOnInit(): void {
    this.loadSettings();
    this.loadSmtpConfig();

    const savedTab = this.navigationState.getSavedTab(this.router.url);
    if (savedTab) {
      this.setTab(savedTab as SettingsTab);
    }
  }

  setTab(tab: SettingsTab): void {
    this.activeTab.set(tab);
    this.navigationState.saveState(this.router.url, tab);

    if (tab === 'facturacion' && !this.csdStatus()) {
      this.loadCsdStatus();
    }
    if (tab === 'notifications' && !this.notificationLoaded()) {
      this.loadNotificationSettings();
    }
    if (tab === 'inventory-alerts' && !this.alertSettingsLoaded()) {
      this.loadAlertSettings();
    }
  }

  private alertSettingsLoaded = signal(false);

  private loadAlertSettings(): void {
    this.alertLoading.set(true);
    this.settingsService.getInventoryAlertSettings().subscribe({
      next: (settings) => {
        this.alertLowStockEnabled.set(settings.lowStockAlertsEnabled);
        this.alertExpiryEnabled.set(settings.expiryAlertsEnabled);
        this.alertReorderEnabled.set(settings.reorderAlertsEnabled);
        this.alertExpiryDays.set(settings.expiryAlertDaysBefore);
        this.alertLowStockPercent.set(settings.lowStockPercentageThreshold);
        this.alertNotifyEmail.set(settings.notifyByEmail);
        this.alertNotifyInApp.set(settings.notifyInApp);
        this.alertEmailList.set(settings.notificationEmailList ?? '');
        this.alertLoading.set(false);
        this.alertSettingsLoaded.set(true);
      },
      error: () => {
        this.alertLoading.set(false);
        this.alertSettingsLoaded.set(true);
      }
    });
  }

  saveAlertSettings(): void {
    this.alertSaving.set(true);
    this.settingsService.updateInventoryAlertSettings({
      lowStockAlertsEnabled: this.alertLowStockEnabled(),
      expiryAlertsEnabled: this.alertExpiryEnabled(),
      reorderAlertsEnabled: this.alertReorderEnabled(),
      expiryAlertDaysBefore: this.alertExpiryDays(),
      lowStockPercentageThreshold: this.alertLowStockPercent(),
      notifyByEmail: this.alertNotifyEmail(),
      notifyInApp: this.alertNotifyInApp(),
      notificationEmailList: this.alertEmailList()
    }).subscribe({
      next: () => {
        this.notifications.success('Configuración de alertas guardada correctamente.');
        this.alertSaving.set(false);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err, 'Error al guardar la configuración.'));
        this.alertSaving.set(false);
      }
    });
  }

  // === Load ===

  private loadSettings(): void {
    this.loading.set(true);
    this.settingsService.getSettings().subscribe({
      next: (data) => {
        this.settings.set(data);
        this.populateGeneralForm(data);
        this.brandingLogoUrl.set(data.logoUrl || '');
        this.domainCustom.set(data.customDomain || '');
        this.loading.set(false);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  private loadSmtpConfig(): void {
    this.settingsService.getSmtpConfiguration().subscribe({
      next: (data) => {
        this.smtpConfig.set(data);
        this.populateSmtpForm(data);
      },
      error: () => {
        // 404 = no config, that's ok
        this.smtpConfig.set(null);
      }
    });
  }

  private populateGeneralForm(s: TenantSettings): void {
    this.generalName.set(s.name);
    this.generalLegalName.set(s.legalName || '');
    this.generalTaxId.set(s.taxId || '');
    this.generalAddress.set(s.address || '');
    this.generalPostalCode.set(s.postalCode || '');
    this.generalRegimenFiscal.set(s.regimenFiscal || '');
    this.generalPhone.set(s.phone || '');
    this.generalEmail.set(s.email || '');
    this.generalWorkingHours.set(s.workingHours || '');
    this.generalTimeZone.set(s.timeZone);
    this.generalLanguage.set(s.language);
    this.generalClues.set(s.clues || '');
  }

  private populateSmtpForm(c: SmtpConfiguration): void {
    this.smtpHost.set(c.smtpHost);
    this.smtpPort.set(c.smtpPort);
    this.smtpUsername.set(c.smtpUsername);
    this.smtpFromEmail.set(c.fromEmail);
    this.smtpFromName.set(c.fromName);
    this.smtpUseSsl.set(c.useSsl);
    this.smtpPassword.set('');
  }

  // === Save General ===

  saveGeneral(): void {
    if (this.saving() || !this.generalName().trim()) return;
    this.saving.set(true);

    this.settingsService.updateSettings({
      name: this.generalName().trim(),
      legalName: this.generalLegalName().trim() || undefined,
      taxId: this.generalTaxId().trim() || undefined,
      address: this.generalAddress().trim() || undefined,
      postalCode: this.generalPostalCode().trim() || undefined,
      regimenFiscal: this.generalRegimenFiscal().trim() || undefined,
      phone: this.generalPhone().trim() || undefined,
      email: this.generalEmail().trim() || undefined,
      workingHours: this.generalWorkingHours().trim() || undefined,
      timeZone: this.generalTimeZone() || undefined,
      language: this.generalLanguage() || undefined,
      clues: this.generalClues().trim() || undefined
    }).subscribe({
      next: (data) => {
        this.settings.set(data);
        this.notifications.success('Configuración general actualizada');
        this.saving.set(false);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
        this.saving.set(false);
      }
    });
  }

  // === Save SMTP ===

  saveSmtp(): void {
    if (this.saving() || !this.smtpHost().trim() || !this.smtpFromEmail().trim()) return;
    this.saving.set(true);

    const request: ConfigureSmtpRequest = {
      smtpHost: this.smtpHost().trim(),
      smtpPort: this.smtpPort(),
      username: this.smtpUsername().trim(),
      password: this.smtpPassword(),
      fromEmail: this.smtpFromEmail().trim(),
      fromName: this.smtpFromName().trim(),
      useSsl: this.smtpUseSsl()
    };

    this.settingsService.configureSmtp(request).subscribe({
      next: (result) => {
        if (result.testSuccessful) {
          this.notifications.success('Configuración SMTP guardada y verificada');
          this.loadSmtpConfig();
        } else {
          this.notifications.error('Error al verificar SMTP: ' + (result.errorMessage || 'Error desconocido'));
        }
        this.saving.set(false);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
        this.saving.set(false);
      }
    });
  }

  testSmtp(): void {
    if (this.smtpTesting() || !this.smtpHost().trim()) return;
    this.smtpTesting.set(true);
    this.smtpTestResult.set(null);

    const request: TestSmtpRequest = {
      smtpHost: this.smtpHost().trim(),
      smtpPort: this.smtpPort(),
      username: this.smtpUsername().trim(),
      password: this.smtpPassword(),
      fromEmail: this.smtpFromEmail().trim(),
      useSsl: this.smtpUseSsl()
    };

    this.settingsService.testSmtp(request).subscribe({
      next: (result) => {
        this.smtpTestResult.set({ success: result.success, message: result.message || result.errorMessage || '' });
        this.smtpTesting.set(false);
      },
      error: () => {
        this.smtpTestResult.set({ success: false, message: 'Error al probar la conexión' });
        this.smtpTesting.set(false);
      }
    });
  }

  deleteSmtp(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.settingsService.deleteSmtpConfiguration().subscribe({
      next: () => {
        this.smtpConfig.set(null);
        this.smtpHost.set('');
        this.smtpPort.set(587);
        this.smtpUsername.set('');
        this.smtpPassword.set('');
        this.smtpFromEmail.set('');
        this.smtpFromName.set('');
        this.smtpUseSsl.set(true);
        this.smtpTestResult.set(null);
        this.notifications.success('Configuración SMTP eliminada');
        this.saving.set(false);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
        this.saving.set(false);
      }
    });
  }

  // === Branding (Image Upload) ===

  onLogoUploaded(imageUrl: string): void {
    this.brandingLogoUrl.set(imageUrl);
    this.notifications.success('Logo actualizado exitosamente');
  }

  onLogoRemoved(): void {
    this.brandingLogoUrl.set('');
    this.notifications.success('Logo eliminado');
  }

  // === Facturación: CSD ===

  loadCsdStatus(): void {
    this.csdLoading.set(true);
    this.cfdiService.getCsdStatus().subscribe({
      next: (data) => {
        this.csdStatus.set(data);
        this.csdLoading.set(false);
      },
      error: () => {
        this.csdStatus.set(null);
        this.csdLoading.set(false);
      }
    });
  }

  onCerFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.csdCerFile.set(input.files[0]);
      this.csdValidationMessage.set(null);
    }
  }

  onKeyFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.csdKeyFile.set(input.files[0]);
      this.csdValidationMessage.set(null);
    }
  }

  validateCsd(): void {
    const cerFile = this.csdCerFile();
    const keyFile = this.csdKeyFile();
    const password = this.csdKeyPassword();
    if (!cerFile || !keyFile || !password || this.csdValidating()) return;

    this.csdValidating.set(true);
    this.csdValidationMessage.set(null);

    this.cfdiService.validateCsd(cerFile, keyFile, password).subscribe({
      next: (result) => {
        if (result.isValid) {
          const meta = result.metadata;
          this.csdValidationMessage.set({
            success: true,
            message: `Certificado válido: ${meta?.noCertificado} — RFC: ${meta?.rfcEmisor} — Vigencia: ${meta?.fechaInicio ? new Date(meta.fechaInicio).toLocaleDateString('es-MX') : '?'} a ${meta?.fechaFin ? new Date(meta.fechaFin).toLocaleDateString('es-MX') : '?'}`
          });
        } else {
          this.csdValidationMessage.set({
            success: false,
            message: result.errorMessage || 'Certificado inválido'
          });
        }
        this.csdValidating.set(false);
      },
      error: (err) => {
        this.csdValidationMessage.set({ success: false, message: getApiErrorMessage(err) });
        this.csdValidating.set(false);
      }
    });
  }

  uploadCsd(): void {
    const cerFile = this.csdCerFile();
    const keyFile = this.csdKeyFile();
    const password = this.csdKeyPassword();
    if (!cerFile || !keyFile || !password || this.csdUploading()) return;

    this.csdUploading.set(true);

    this.cfdiService.uploadCsd(cerFile, keyFile, password).subscribe({
      next: () => {
        this.notifications.success('Certificado CSD cargado exitosamente');
        this.csdCerFile.set(null);
        this.csdKeyFile.set(null);
        this.csdKeyPassword.set('');
        this.csdValidationMessage.set(null);
        this.loadCsdStatus();
        this.csdUploading.set(false);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
        this.csdUploading.set(false);
      }
    });
  }

  revokeCsd(): void {
    const cert = this.csdStatus()?.certificate;
    if (!cert) return;

    this.cfdiService.revokeCsd(cert.id, 'Revocado manualmente desde configuración').subscribe({
      next: () => {
        this.notifications.success('Certificado CSD revocado');
        this.loadCsdStatus();
      },
      error: (err) => this.notifications.error(getApiErrorMessage(err))
    });
  }

  // === WhatsApp Config (Legacy - migrating to Notifications) ===

  waEnabled = signal(false);
  waReminderHours = signal(24);
  waAutoReminders = signal(true);
  waCustomGreeting = signal('');
  waSaving = signal(false);
  waLoaded = signal(false);

  loadWhatsAppConfig(): void {
    this.messagingService.getConfig().subscribe({
      next: (config) => {
        this.waEnabled.set(config.isEnabled);
        this.waReminderHours.set(config.reminderHoursBefore);
        this.waAutoReminders.set(config.autoRemindersEnabled);
        this.waCustomGreeting.set(config.customGreeting ?? '');
        this.waLoaded.set(true);
      },
      error: () => {
        this.waLoaded.set(true);
      }
    });
  }

  saveWhatsAppConfig(): void {
    if (this.waSaving()) return;
    this.waSaving.set(true);
    this.messagingService.updateConfig({
      isEnabled: this.waEnabled(),
      reminderHoursBefore: this.waReminderHours(),
      autoRemindersEnabled: this.waAutoReminders(),
      customGreeting: this.waCustomGreeting().trim() || null
    }).subscribe({
      next: () => {
        this.notifications.success('Configuración de WhatsApp guardada');
        this.waSaving.set(false);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
        this.waSaving.set(false);
      }
    });
  }

  // === Unified Notifications Config ===

  notificationLoaded = signal(false);
  notificationSaving = signal(false);

  waChannelEnabled = signal(true);
  waChannelPhone = signal('');
  emailChannelEnabled = signal(false);
  emailRequiresConfig = signal(false);

  appointmentReminderActive = signal(true);
  appointmentReminderChannels = signal<string[]>(['whatsapp']);
  appointmentReminderHours = signal<number[]>([24]);

  postTreatmentActive = signal(false);
  postTreatmentChannels = signal<string[]>(['whatsapp']);
  postTreatmentDays = signal(7);

  birthdayActive = signal(false);
  birthdayChannels = signal<string[]>(['whatsapp']);
  birthdaySendGreeting = signal(true);

  REMINDER_HOURS_OPTIONS = REMINDER_HOURS_OPTIONS;
  POST_TREATMENT_DAYS_OPTIONS = POST_TREATMENT_DAYS_OPTIONS;

  // Templates disponibles para seleccionar en cada tipo de notificación
  emailTemplatesForSettings = signal<NotificationTemplate[]>([]);
  whatsAppTemplatesForSettings = signal<NotificationTemplate[]>([]);
  // Mapa de selecciones: "AppointmentReminder_Email" → "guid"
  templateSelections = signal<Record<string, string>>({});

  loadNotificationSettings(): void {
    // Cargar templates disponibles para los dropdowns de selección
    this.notificationTemplateService.getAll('Email').subscribe(t => this.emailTemplatesForSettings.set(t));
    this.notificationTemplateService.getAll('WhatsApp').subscribe(t => this.whatsAppTemplatesForSettings.set(t));

    this.notificationService.getSettings().subscribe({
      next: (settings) => {
        this.waChannelEnabled.set(settings.channels.whatsapp.isEnabled);
        this.waChannelPhone.set(settings.channels.whatsapp.accountPhone || '');
        this.emailChannelEnabled.set(settings.channels.email.isEnabled);
        this.emailRequiresConfig.set(settings.channels.email.requiresConfig);

        this.appointmentReminderActive.set(settings.types.appointmentReminder.isActive);
        this.appointmentReminderChannels.set([...settings.types.appointmentReminder.channels]);
        this.appointmentReminderHours.set([...settings.types.appointmentReminder.hoursBefore]);

        this.postTreatmentActive.set(settings.types.postTreatment.isActive);
        this.postTreatmentChannels.set([...settings.types.postTreatment.channels]);
        this.postTreatmentDays.set(settings.types.postTreatment.daysAfter);

        this.birthdayActive.set(settings.types.birthday.isActive);
        this.birthdayChannels.set([...settings.types.birthday.channels]);
        this.birthdaySendGreeting.set(settings.types.birthday.sendGreeting);

        if (settings.templateSelections) {
          // Convertir Guid? → string (filtrar nulls)
          const sel: Record<string, string> = {};
          for (const [key, val] of Object.entries(settings.templateSelections)) {
            if (val) sel[key] = val as string;
          }
          this.templateSelections.set(sel);
        }

        this.notificationLoaded.set(true);
      },
      error: () => {
        this.notificationLoaded.set(true);
      }
    });
  }

  getTemplateSelection(notificationType: string, channel: string): string {
    return this.templateSelections()[`${notificationType}_${channel}`] ?? '';
  }

  onTemplateSelected(notificationType: string, channel: string, templateId: string): void {
    this.templateSelections.update(sel => {
      const updated = { ...sel };
      if (templateId) {
        updated[`${notificationType}_${channel}`] = templateId;
      } else {
        delete updated[`${notificationType}_${channel}`];
      }
      return updated;
    });
  }

  saveNotificationSettings(): void {
    if (this.notificationSaving()) return;
    this.notificationSaving.set(true);

    const settings = {
      channels: {
        whatsapp: {
          isEnabled: this.waChannelEnabled(),
          accountPhone: this.waChannelPhone() || undefined
        },
        email: {
          isEnabled: this.emailChannelEnabled(),
          requiresConfig: this.emailRequiresConfig()
        }
      },
      types: {
        appointmentReminder: {
          isActive: this.appointmentReminderActive(),
          channels: this.appointmentReminderChannels() as ('whatsapp' | 'email')[],
          hoursBefore: this.appointmentReminderHours()
        },
        postTreatment: {
          isActive: this.postTreatmentActive(),
          channels: this.postTreatmentChannels() as ('whatsapp' | 'email')[],
          daysAfter: this.postTreatmentDays()
        },
        birthday: {
          isActive: this.birthdayActive(),
          channels: this.birthdayChannels() as ('whatsapp' | 'email')[],
          sendGreeting: this.birthdaySendGreeting()
        }
      },
      templateSelections: this.templateSelections()
    };

    this.notificationService.updateSettings(settings).subscribe({
      next: () => {
        this.notifications.success('Configuración de notificaciones guardada');
        this.notificationSaving.set(false);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
        this.notificationSaving.set(false);
      }
    });
  }

  toggleChannel(channel: 'whatsapp' | 'email'): void {
    if (channel === 'whatsapp') {
      this.waChannelEnabled.update(v => !v);
    } else {
      this.emailChannelEnabled.update(v => !v);
    }
  }

  toggleReminderChannel(channel: 'whatsapp' | 'email', type: 'appointment' | 'postTreatment' | 'birthday'): void {
    let currentChannels: string[];
    let setter: (v: string[]) => void;

    switch (type) {
      case 'appointment':
        currentChannels = this.appointmentReminderChannels();
        setter = (v) => this.appointmentReminderChannels.set(v);
        break;
      case 'postTreatment':
        currentChannels = this.postTreatmentChannels();
        setter = (v) => this.postTreatmentChannels.set(v);
        break;
      case 'birthday':
        currentChannels = this.birthdayChannels();
        setter = (v) => this.birthdayChannels.set(v);
        break;
    }

    if (currentChannels.includes(channel)) {
      setter(currentChannels.filter(c => c !== channel));
    } else {
      setter([...currentChannels, channel]);
    }
  }

  toggleReminderHour(hour: number): void {
    const current = this.appointmentReminderHours();
    if (current.includes(hour)) {
      this.appointmentReminderHours.set(current.filter(h => h !== hour));
    } else {
      this.appointmentReminderHours.set([...current, hour].sort((a, b) => b - a));
    }
  }

  // === Save Domain ===

  saveDomain(): void {
    if (this.saving() || !this.domainCustom().trim()) return;
    this.saving.set(true);
    this.settingsService.updateDomain({ customDomain: this.domainCustom().trim() }).subscribe({
      next: () => {
        this.notifications.success('Dominio personalizado actualizado');
        this.saving.set(false);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
        this.saving.set(false);
      }
    });
  }
}
