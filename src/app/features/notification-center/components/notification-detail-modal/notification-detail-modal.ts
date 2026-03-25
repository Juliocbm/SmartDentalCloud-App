import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { ModalComponentBase, ModalRef } from '../../../../shared/services/modal.service';
import { PermissionService, PERMISSIONS } from '../../../../core/services/permission.service';
import { NotificationCenterService } from '../../services/notification-center.service';
import {
  NotificationQueueDetail,
  NOTIFICATION_STATUS_CONFIG,
  CHANNEL_CONFIG,
  NOTIFICATION_TYPE_LABELS,
  PRIORITY_CONFIG,
} from '../../models/notification-center.models';

export interface NotificationDetailData {
  notificationId: string;
}

@Component({
  selector: 'app-notification-detail-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './notification-detail-modal.html',
  styleUrl: './notification-detail-modal.scss'
})
export class NotificationDetailModalComponent implements ModalComponentBase<NotificationDetailData, string>, OnInit {
  modalData?: NotificationDetailData;
  modalRef?: ModalRef<NotificationDetailData, string>;

  private service = inject(NotificationCenterService);
  permissionService = inject(PermissionService);

  detail = signal<NotificationQueueDetail | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  STATUS_CONFIG = NOTIFICATION_STATUS_CONFIG;
  CHANNEL_CONFIG = CHANNEL_CONFIG;
  TYPE_LABELS = NOTIFICATION_TYPE_LABELS;
  PRIORITY_CONFIG = PRIORITY_CONFIG;
  PERMISSIONS = PERMISSIONS;

  ngOnInit(): void {
    if (this.modalData?.notificationId) {
      this.loadDetail(this.modalData.notificationId);
    }
  }

  private loadDetail(id: string): void {
    this.loading.set(true);
    this.service.getDetail(id).subscribe({
      next: (data) => {
        this.detail.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar el detalle de la notificación');
        this.loading.set(false);
      }
    });
  }

  close(): void {
    this.modalRef?.close();
  }

  sendNow(): void {
    const d = this.detail();
    if (!d) return;
    this.service.sendNow(d.id).subscribe({
      next: () => this.modalRef?.close('refreshed'),
      error: () => this.error.set('Error al enviar')
    });
  }

  retry(): void {
    const d = this.detail();
    if (!d) return;
    this.service.retry(d.id).subscribe({
      next: () => this.modalRef?.close('refreshed'),
      error: () => this.error.set('Error al reintentar')
    });
  }

  cancel(): void {
    const d = this.detail();
    if (!d) return;
    this.service.cancel(d.id).subscribe({
      next: () => this.modalRef?.close('refreshed'),
      error: () => this.error.set('Error al cancelar')
    });
  }

  getStatusConfig(status: string) {
    return this.STATUS_CONFIG[status] ?? { label: status, cssClass: 'badge-neutral', icon: 'fa-question' };
  }

  getChannelConfig(channel: string) {
    return this.CHANNEL_CONFIG[channel] ?? { label: channel, icon: 'fa-solid fa-circle', cssClass: '' };
  }

  getTypeLabel(type: string | null): string {
    return type ? (this.TYPE_LABELS[type] ?? type) : '—';
  }

  getPriorityLabel(priority: number): string {
    return this.PRIORITY_CONFIG[priority]?.label ?? 'Normal';
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
