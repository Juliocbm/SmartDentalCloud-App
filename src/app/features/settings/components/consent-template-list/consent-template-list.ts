import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsentTemplateService, ConsentTemplate, CONSENT_TYPE_OPTIONS } from '../../services/consent-template.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

@Component({
  selector: 'app-consent-template-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consent-template-list.html',
  styleUrl: './consent-template-list.scss'
})
export class ConsentTemplateListComponent implements OnInit {
  private templateService = inject(ConsentTemplateService);
  private notifications = inject(NotificationService);

  templates = signal<ConsentTemplate[]>([]);
  loading = signal(false);
  saving = signal(false);

  // Form state
  showForm = signal(false);
  editingId = signal<string | null>(null);
  formConsentType = signal('GeneralTreatment');
  formTitle = signal('');
  formContent = signal('');
  formIsDefault = signal(false);

  CONSENT_TYPE_OPTIONS = CONSENT_TYPE_OPTIONS;

  ngOnInit(): void {
    this.loadTemplates();
  }

  private loadTemplates(): void {
    this.loading.set(true);
    this.templateService.getAll().subscribe({
      next: (data) => {
        this.templates.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  getConsentTypeLabel(value: string): string {
    return CONSENT_TYPE_OPTIONS.find(o => o.value === value)?.label ?? value;
  }

  openNewForm(): void {
    this.editingId.set(null);
    this.formConsentType.set('GeneralTreatment');
    this.formTitle.set('');
    this.formContent.set('');
    this.formIsDefault.set(false);
    this.showForm.set(true);
  }

  editTemplate(t: ConsentTemplate): void {
    this.editingId.set(t.id);
    this.formConsentType.set(t.consentType);
    this.formTitle.set(t.title);
    this.formContent.set(t.content);
    this.formIsDefault.set(t.isDefault);
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  saveTemplate(): void {
    if (this.saving() || !this.formTitle().trim() || !this.formContent().trim()) return;
    this.saving.set(true);

    const payload = {
      consentType: this.formConsentType(),
      title: this.formTitle().trim(),
      content: this.formContent().trim(),
      isDefault: this.formIsDefault()
    };

    const id = this.editingId();
    const obs = id
      ? this.templateService.update(id, payload)
      : this.templateService.create(payload);

    obs.subscribe({
      next: () => {
        this.notifications.success(id ? 'Plantilla actualizada' : 'Plantilla creada');
        this.saving.set(false);
        this.showForm.set(false);
        this.editingId.set(null);
        this.loadTemplates();
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
        this.saving.set(false);
      }
    });
  }

  async deactivateTemplate(t: ConsentTemplate): Promise<void> {
    const confirmed = await this.notifications.confirm(
      `¿Desactivar la plantilla "${t.title}"? No se eliminará, solo dejará de estar disponible.`
    );
    if (!confirmed) return;

    this.templateService.deactivate(t.id).subscribe({
      next: () => {
        this.notifications.success('Plantilla desactivada');
        this.loadTemplates();
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err));
      }
    });
  }
}
