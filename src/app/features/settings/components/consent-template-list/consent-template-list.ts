import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsentTemplateService, ConsentTemplate, CONSENT_TYPE_OPTIONS } from '../../services/consent-template.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import { PermissionService, PERMISSIONS } from '../../../../core/services/permission.service';
import { ModalService } from '../../../../shared/services/modal.service';
import { ConsentTemplateFormModalComponent, ConsentTemplateFormModalData } from '../consent-template-form-modal/consent-template-form-modal';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-consent-template-list',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  templateUrl: './consent-template-list.html',
  styleUrl: './consent-template-list.scss'
})
export class ConsentTemplateListComponent implements OnInit {
  permissionService = inject(PermissionService);
  PERMISSIONS = PERMISSIONS;
  private templateService = inject(ConsentTemplateService);
  private notifications = inject(NotificationService);
  private modalService = inject(ModalService);

  templates = signal<ConsentTemplate[]>([]);
  loading = signal(false);

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

  openTemplateModal(template?: ConsentTemplate): void {
    const ref = this.modalService.open<ConsentTemplateFormModalData, boolean>(
      ConsentTemplateFormModalComponent,
      { data: { template } }
    );
    ref.afterClosed().subscribe(result => {
      if (result) this.loadTemplates();
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
