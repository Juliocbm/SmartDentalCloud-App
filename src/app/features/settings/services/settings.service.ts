import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  TenantSettings,
  UpdateTenantSettingsRequest,
  UpdateBrandingRequest,
  UpdateDomainRequest,
  SmtpConfiguration,
  ConfigureSmtpRequest,
  ConfigureSmtpResult,
  TestSmtpRequest,
  SmtpTestResult
} from '../models/settings.models';
import { WorkSchedule } from '../models/work-schedule.models';
import {
  ScheduleException,
  CreateScheduleExceptionRequest,
  UpdateScheduleExceptionRequest
} from '../models/schedule-exception.models';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private api = inject(ApiService);

  getSettings(): Observable<TenantSettings> {
    return this.api.get<TenantSettings>('/tenants/settings');
  }

  updateSettings(request: UpdateTenantSettingsRequest): Observable<TenantSettings> {
    return this.api.put<TenantSettings>('/tenants/settings', request);
  }

  updateBranding(request: UpdateBrandingRequest): Observable<void> {
    return this.api.put<void>('/tenants/branding', request);
  }

  updateDomain(request: UpdateDomainRequest): Observable<void> {
    return this.api.put<void>('/tenants/domain', request);
  }

  getSmtpConfiguration(): Observable<SmtpConfiguration> {
    return this.api.get<SmtpConfiguration>('/tenants/smtp-configuration');
  }

  configureSmtp(request: ConfigureSmtpRequest): Observable<ConfigureSmtpResult> {
    return this.api.post<ConfigureSmtpResult>('/tenants/smtp-configuration', request);
  }

  testSmtp(request: TestSmtpRequest): Observable<SmtpTestResult> {
    return this.api.post<SmtpTestResult>('/tenants/smtp-configuration/test', request);
  }

  deleteSmtpConfiguration(): Observable<void> {
    return this.api.delete<void>('/tenants/smtp-configuration');
  }

  getWorkSchedule(locationId?: string | null): Observable<WorkSchedule> {
    const params: Record<string, string> = {};
    if (locationId) params['locationId'] = locationId;
    return this.api.get<WorkSchedule>('/tenants/work-schedule', params);
  }

  updateWorkSchedule(schedule: WorkSchedule): Observable<WorkSchedule> {
    return this.api.put<WorkSchedule>('/tenants/work-schedule', schedule);
  }

  getDentistWorkSchedule(userId: string, locationId?: string | null): Observable<WorkSchedule> {
    const params: Record<string, string> = {};
    if (locationId) params['locationId'] = locationId;
    return this.api.get<WorkSchedule>(`/tenants/work-schedule/${userId}`, params);
  }

  updateDentistWorkSchedule(userId: string, schedule: WorkSchedule): Observable<WorkSchedule> {
    return this.api.put<WorkSchedule>(`/tenants/work-schedule/${userId}`, schedule);
  }

  // === Schedule Exceptions ===

  getScheduleExceptions(from?: string, to?: string, userId?: string): Observable<ScheduleException[]> {
    const params: Record<string, string> = {};
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    if (userId) params['userId'] = userId;
    return this.api.get<ScheduleException[]>('/schedule-exceptions', params);
  }

  createScheduleException(request: CreateScheduleExceptionRequest): Observable<ScheduleException> {
    return this.api.post<ScheduleException>('/schedule-exceptions', request);
  }

  updateScheduleException(id: string, request: UpdateScheduleExceptionRequest): Observable<ScheduleException> {
    return this.api.put<ScheduleException>(`/schedule-exceptions/${id}`, request);
  }

  deleteScheduleException(id: string): Observable<void> {
    return this.api.delete<void>(`/schedule-exceptions/${id}`);
  }
}
