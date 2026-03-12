import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, QueryParams } from '../../../core/services/api.service';
import {
  SendWhatsAppRequest,
  SendWhatsAppResult,
  ScheduleWhatsAppRequest,
  ScheduleWhatsAppResult,
  WhatsAppTemplate,
  MessageLogPaginated,
  WhatsAppTenantConfig,
} from '../models/messaging.models';

@Injectable({ providedIn: 'root' })
export class MessagingService {
  private api = inject(ApiService);
  private readonly baseUrl = '/messaging';

  sendWhatsApp(request: SendWhatsAppRequest): Observable<SendWhatsAppResult> {
    return this.api.post<SendWhatsAppResult>(`${this.baseUrl}/send`, request);
  }

  getTemplates(): Observable<WhatsAppTemplate[]> {
    return this.api.get<WhatsAppTemplate[]>(`${this.baseUrl}/templates`);
  }

  getMessageLog(
    pageNumber = 1,
    pageSize = 20,
    patientId?: string,
    channel?: string,
    status?: string
  ): Observable<MessageLogPaginated> {
    const params: QueryParams = { pageNumber, pageSize };
    if (patientId) params['patientId'] = patientId;
    if (channel) params['channel'] = channel;
    if (status) params['status'] = status;
    return this.api.get<MessageLogPaginated>(`${this.baseUrl}/log`, params);
  }

  scheduleWhatsApp(request: ScheduleWhatsAppRequest): Observable<ScheduleWhatsAppResult> {
    return this.api.post<ScheduleWhatsAppResult>(`${this.baseUrl}/schedule`, request);
  }

  getConfig(): Observable<WhatsAppTenantConfig> {
    return this.api.get<WhatsAppTenantConfig>(`${this.baseUrl}/config`);
  }

  updateConfig(config: WhatsAppTenantConfig): Observable<WhatsAppTenantConfig> {
    return this.api.put<WhatsAppTenantConfig>(`${this.baseUrl}/config`, config);
  }
}
