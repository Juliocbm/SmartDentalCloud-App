import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AppNotification } from '../models/notification.models';

@Injectable({ providedIn: 'root' })
export class NotificationsApiService {
  private api = inject(ApiService);

  getNotifications(unreadOnly?: boolean): Observable<AppNotification[]> {
    const params = unreadOnly != null ? { unreadOnly } : {};
    return this.api.get<AppNotification[]>('/notifications', params as any);
  }

  markAsRead(id: string): Observable<void> {
    return this.api.put<void>(`/notifications/${id}/read`, {});
  }

  markAllAsRead(): Observable<{ markedAsRead: number }> {
    return this.api.put<{ markedAsRead: number }>('/notifications/read-all', {});
  }
}
