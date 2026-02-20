import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, QueryParams } from '../../../core/services/api.service';
import { AuditLogEntry } from '../models/audit-log.models';

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private api = inject(ApiService);

  getLogs(params?: {
    entityType?: string;
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Observable<AuditLogEntry[]> {
    const queryParams: QueryParams = {};
    if (params?.entityType) queryParams['entityType'] = params.entityType;
    if (params?.userId) queryParams['userId'] = params.userId;
    if (params?.action) queryParams['action'] = params.action;
    if (params?.startDate) queryParams['startDate'] = params.startDate;
    if (params?.endDate) queryParams['endDate'] = params.endDate;
    if (params?.pageNumber) queryParams['pageNumber'] = params.pageNumber;
    if (params?.pageSize) queryParams['pageSize'] = params.pageSize;
    return this.api.get<AuditLogEntry[]>('/audit-logs', queryParams);
  }
}
