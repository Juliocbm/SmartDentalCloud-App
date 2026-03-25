import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationTemplateService } from '../../services/notification-template.service';
import {
  NotificationTemplate,
  NOTIFICATION_TEMPLATE_TYPES,
} from '../../models/notification-template.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { ModalService } from '../../../../shared/services/modal.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';
import {
  NotificationTemplateFormModalComponent,
  NotificationTemplateFormModalData,
} from '../notification-template-form-modal/notification-template-form-modal';

type ChannelTab = 'Email' | 'SMS' | 'WhatsApp';

@Component({
  selector: 'app-notification-template-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-template-list.html',
  styleUrl: './notification-template-list.scss'
})
export class NotificationTemplateListComponent implements OnInit {
  private templateService = inject(NotificationTemplateService);
  private notifications = inject(NotificationService);
  private modalService = inject(ModalService);

  templates = signal<NotificationTemplate[]>([]);
  loading = signal(false);
  syncing = signal(false);
  activeTab = signal<ChannelTab>('Email');

  readonly tabs: { value: ChannelTab; label: string; icon: string }[] = [
    { value: 'Email',    label: 'Email',    icon: 'fa-envelope' },
    { value: 'SMS',      label: 'SMS',      icon: 'fa-comment-sms' },
    { value: 'WhatsApp', label: 'WhatsApp', icon: 'fa-brands fa-whatsapp' },
  ];

  filteredTemplates = computed(() =>
    this.templates().filter(t => t.channel === this.activeTab())
  );

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
        this.notifications.error(getApiErrorMessage(err, 'Error al cargar plantillas'));
        this.loading.set(false);
      }
    });
  }

  setTab(tab: ChannelTab): void {
    this.activeTab.set(tab);
  }

  getTypeLabel(value: string): string {
    return NOTIFICATION_TEMPLATE_TYPES.find(t => t.value === value)?.label ?? value;
  }

  openModal(template?: NotificationTemplate): void {
    const channel = template?.channel ?? (this.activeTab() !== 'WhatsApp' ? this.activeTab() : 'Email');
    const ref = this.modalService.open<NotificationTemplateFormModalData, boolean>(
      NotificationTemplateFormModalComponent,
      { data: { template, defaultChannel: channel as 'Email' | 'SMS' } }
    );
    ref.afterClosed().subscribe(result => {
      if (result) this.loadTemplates();
    });
  }

  async deactivate(t: NotificationTemplate): Promise<void> {
    const confirmed = await this.notifications.confirm(
      `¿Desactivar la plantilla "${t.displayName}"? No se eliminará, solo dejará de estar disponible.`
    );
    if (!confirmed) return;

    this.templateService.deactivate(t.id).subscribe({
      next: () => {
        this.notifications.success('Plantilla desactivada');
        this.loadTemplates();
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err, 'Error al desactivar plantilla'));
      }
    });
  }

  syncWhatsApp(): void {
    this.syncing.set(true);
    this.templateService.syncWhatsApp().subscribe({
      next: (result) => {
        this.notifications.success(`Sincronización completada: ${result.synced} template(s) actualizados`);
        this.syncing.set(false);
        this.loadTemplates();
      },
      error: (err) => {
        this.notifications.error(getApiErrorMessage(err, 'Error al sincronizar con Twilio'));
        this.syncing.set(false);
      }
    });
  }
}
