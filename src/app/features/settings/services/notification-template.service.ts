import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, QueryParams } from '../../../core/services/api.service';
import {
  NotificationTemplate,
  CreateNotificationTemplateRequest,
  UpdateNotificationTemplateRequest,
} from '../models/notification-template.models';

@Injectable({ providedIn: 'root' })
export class NotificationTemplateService {
  private api = inject(ApiService);
  private readonly baseUrl = '/notification-templates';

  getAll(channel?: string, notificationType?: string): Observable<NotificationTemplate[]> {
    const params: QueryParams = {};
    if (channel) params['channel'] = channel;
    if (notificationType) params['notificationType'] = notificationType;
    return this.api.get<NotificationTemplate[]>(this.baseUrl, params);
  }

  create(request: CreateNotificationTemplateRequest): Observable<NotificationTemplate> {
    return this.api.post<NotificationTemplate>(this.baseUrl, request);
  }

  update(id: string, request: UpdateNotificationTemplateRequest): Observable<NotificationTemplate> {
    return this.api.put<NotificationTemplate>(`${this.baseUrl}/${id}`, request);
  }

  deactivate(id: string): Observable<void> {
    return this.api.patch<void>(`${this.baseUrl}/${id}/deactivate`, {});
  }

  /** Sincroniza los templates de Twilio hacia la DB (solo para canal WhatsApp) */
  syncWhatsApp(): Observable<{ synced: number }> {
    return this.api.post<{ synced: number }>(`${this.baseUrl}/whatsapp/sync`, {});
  }
}
