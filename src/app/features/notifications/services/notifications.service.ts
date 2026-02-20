import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, QueryParams } from '../../../core/services/api.service';
import { AppNotification } from '../models/notification.models';

@Injectable({ providedIn: 'root' })
export class NotificationsApiService {
  private api = inject(ApiService);

  getNotifications(unreadOnly?: boolean): Observable<AppNotification[]> {
    const params: QueryParams = {};
    if (unreadOnly != null) params['unreadOnly'] = unreadOnly;
    return this.api.get<AppNotification[]>('/notifications', params);
  }

  markAsRead(id: string): Observable<void> {
    return this.api.put<void>(`/notifications/${id}/read`, {});
  }

  markAllAsRead(): Observable<{ markedAsRead: number }> {
    return this.api.put<{ markedAsRead: number }>('/notifications/read-all', {});
  }
}
