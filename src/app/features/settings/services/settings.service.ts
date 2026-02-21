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

  getWorkSchedule(): Observable<WorkSchedule> {
    return this.api.get<WorkSchedule>('/tenants/work-schedule');
  }

  updateWorkSchedule(schedule: WorkSchedule): Observable<WorkSchedule> {
    return this.api.put<WorkSchedule>('/tenants/work-schedule', schedule);
  }

  getDentistWorkSchedule(userId: string): Observable<WorkSchedule> {
    return this.api.get<WorkSchedule>(`/tenants/work-schedule/${userId}`);
  }

  updateDentistWorkSchedule(userId: string, schedule: WorkSchedule): Observable<WorkSchedule> {
    return this.api.put<WorkSchedule>(`/tenants/work-schedule/${userId}`, schedule);
  }
}
