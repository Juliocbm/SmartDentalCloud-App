import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header';
import { NotificationsApiService } from '../../services/notifications.service';
import { AppNotification, NOTIFICATION_TYPE_CONFIG } from '../../models/notification.models';
import { getApiErrorMessage } from '../../../../core/utils/api-error.utils';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent],
  templateUrl: './notification-list.html',
  styleUrl: './notification-list.scss'
})
export class NotificationListComponent implements OnInit {
  private notifService = inject(NotificationsApiService);

  notifications = signal<AppNotification[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fa-home' },
    { label: 'Notificaciones' }
  ];

  ngOnInit(): void {
    this.loadNotifications();
  }

  private loadNotifications(): void {
    this.loading.set(true);
    this.error.set(null);
    this.notifService.getNotifications().subscribe({
      next: (data) => { this.notifications.set(data); this.loading.set(false); },
      error: (err) => { this.error.set(getApiErrorMessage(err)); this.loading.set(false); }
    });
  }

  markAsRead(notif: AppNotification): void {
    if (notif.isRead) return;
    this.notifService.markAsRead(notif.id).subscribe({
      next: () => {
        this.notifications.update(list =>
          list.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
        );
      }
    });
  }

  markAllAsRead(): void {
    this.notifService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
      }
    });
  }

  getTypeConfig(type: string) {
    return NOTIFICATION_TYPE_CONFIG[type] || { icon: 'fa-bell', class: 'notif-info' };
  }

  getUnreadCount(): number {
    return this.notifications().filter(n => !n.isRead).length;
  }

  formatTimeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `hace ${days}d`;
  }
}
