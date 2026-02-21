import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { WorkScheduleEditorComponent } from '../work-schedule-editor/work-schedule-editor';
import { SettingsService } from '../../services/settings.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  TenantSettings,
  SmtpConfiguration,
  ConfigureSmtpRequest,
  TestSmtpRequest,
  TIMEZONE_OPTIONS,
  LANGUAGE_OPTIONS
} from '../../models/settings.models';

type SettingsTab = 'general' | 'schedule' | 'smtp' | 'branding' | 'domain';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, WorkScheduleEditorComponent],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss'
})
export class SettingsPageComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private notifications = inject(NotificationService);

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
  generalWorkingHours = signal('');
  generalTimeZone = signal('');
  generalLanguage = signal('');

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

  // Branding form
  brandingLogoUrl = signal('');

  // Domain form
  domainCustom = signal('');

  // Constants
  TIMEZONE_OPTIONS = TIMEZONE_OPTIONS;
  LANGUAGE_OPTIONS = LANGUAGE_OPTIONS;

  tabs: { key: SettingsTab; label: string; icon: string }[] = [
    { key: 'general', label: 'General', icon: 'fa-gear' },
    { key: 'schedule', label: 'Horario', icon: 'fa-clock' },
    { key: 'smtp', label: 'Correo (SMTP)', icon: 'fa-envelope' },
    { key: 'branding', label: 'Branding', icon: 'fa-palette' },
    { key: 'domain', label: 'Dominio', icon: 'fa-globe' }
  ];

  ngOnInit(): void {
    this.loadSettings();
    this.loadSmtpConfig();
  }

  setTab(tab: SettingsTab): void {
    this.activeTab.set(tab);
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
      error: () => {
        this.notifications.error('Error al cargar la configuración');
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
    this.generalWorkingHours.set(s.workingHours || '');
    this.generalTimeZone.set(s.timeZone);
    this.generalLanguage.set(s.language);
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
      workingHours: this.generalWorkingHours().trim() || undefined,
      timeZone: this.generalTimeZone() || undefined,
      language: this.generalLanguage() || undefined
    }).subscribe({
      next: (data) => {
        this.settings.set(data);
        this.notifications.success('Configuración general actualizada');
        this.saving.set(false);
      },
      error: () => {
        this.notifications.error('Error al guardar la configuración');
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
      error: () => {
        this.notifications.error('Error al guardar la configuración SMTP');
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
      error: () => {
        this.notifications.error('Error al eliminar configuración SMTP');
        this.saving.set(false);
      }
    });
  }

  // === Save Branding ===

  saveBranding(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.settingsService.updateBranding({ logoUrl: this.brandingLogoUrl().trim() || undefined }).subscribe({
      next: () => {
        this.notifications.success('Branding actualizado');
        this.saving.set(false);
      },
      error: () => {
        this.notifications.error('Error al actualizar branding');
        this.saving.set(false);
      }
    });
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
      error: () => {
        this.notifications.error('Error al actualizar dominio');
        this.saving.set(false);
      }
    });
  }
}
