import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { ModalComponent } from '../modal/modal';

/**
 * Componente global de notificaciones toast.
 * Debe incluirse una vez en el LayoutComponent.
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastComponent {
  private notificationService = inject(NotificationService);

  notifications = this.notificationService.notifications;
  pendingConfirm = this.notificationService.pendingConfirm;

  dismiss(id: number): void {
    this.notificationService.dismiss(id);
  }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      success: 'fa-circle-check',
      error: 'fa-circle-xmark',
      warning: 'fa-triangle-exclamation',
      info: 'fa-circle-info'
    };
    return icons[type] || 'fa-circle-info';
  }

  onConfirm(): void {
    this.notificationService.resolveConfirm(true);
  }

  onCancel(): void {
    this.notificationService.resolveConfirm(false);
  }
}
