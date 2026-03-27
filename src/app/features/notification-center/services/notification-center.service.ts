import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, QueryParams } from '../../../core/services/api.service';
import {
  NotificationQueueItem,
  NotificationQueueDetail,
  NotificationStats,
  PaginatedResult,
  CreateNotificationRequest,
} from '../models/notification-center.models';

@Injectable({ providedIn: 'root' })
export class NotificationCenterService {
  private api = inject(ApiService);
  private readonly baseUrl = '/notifications';

  getQueue(
    pageNumber = 1,
    pageSize = 20,
    channel?: string,
    status?: string,
    notificationType?: string,
    from?: string,
    to?: string,
    search?: string,
    sortBy?: string,
    sortDirection?: string
  ): Observable<PaginatedResult<NotificationQueueItem>> {
    const params: QueryParams = { pageNumber, pageSize };
    if (channel) params['channel'] = channel;
    if (status) params['status'] = status;
    if (notificationType) params['notificationType'] = notificationType;
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    if (search) params['search'] = search;
    if (sortBy) params['orderBy'] = sortBy;
    if (sortDirection) params['sortDirection'] = sortDirection;
    return this.api.get<PaginatedResult<NotificationQueueItem>>(`${this.baseUrl}/queue`, params);
  }

  getDetail(id: string): Observable<NotificationQueueDetail> {
    return this.api.get<NotificationQueueDetail>(`${this.baseUrl}/queue/${id}`);
  }

  createManual(request: CreateNotificationRequest): Observable<{ id: string }> {
    return this.api.post<{ id: string }>(`${this.baseUrl}/queue`, request);
  }

  sendNow(id: string): Observable<{ success: boolean }> {
    return this.api.post<{ success: boolean }>(`${this.baseUrl}/queue/${id}/send`, {});
  }

  retry(id: string): Observable<{ success: boolean }> {
    return this.api.post<{ success: boolean }>(`${this.baseUrl}/queue/${id}/retry`, {});
  }

  cancel(id: string, reason?: string): Observable<{ success: boolean }> {
    return this.api.patch<{ success: boolean }>(`${this.baseUrl}/queue/${id}/cancel`, { reason });
  }

  bulkRetry(): Observable<{ retriedCount: number }> {
    return this.api.post<{ retriedCount: number }>(`${this.baseUrl}/queue/bulk/retry`, {});
  }

  getStats(from?: string, to?: string, channel?: string): Observable<NotificationStats> {
    const params: QueryParams = {};
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    if (channel) params['channel'] = channel;
    return this.api.get<NotificationStats>(`${this.baseUrl}/stats`, params);
  }
}
