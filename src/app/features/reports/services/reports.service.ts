import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, QueryParams } from '../../../core/services/api.service';
import { AccountsReceivableItem, IncomeReport, TreatmentsSummary, DentistProductivity, InventorySummary, AppointmentOccupancy, TopService } from '../models/report.models';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private api = inject(ApiService);

  getAccountsReceivable(patientId?: string, minDaysOverdue?: number): Observable<AccountsReceivableItem[]> {
    const params: QueryParams = {};
    if (patientId) params['patientId'] = patientId;
    if (minDaysOverdue != null) params['minDaysOverdue'] = minDaysOverdue;
    return this.api.get<AccountsReceivableItem[]>('/reports/accounts-receivable', params);
  }

  getIncomeReport(startDate?: string, endDate?: string): Observable<IncomeReport> {
    const params: QueryParams = {};
    if (startDate) params['startDate'] = startDate;
    if (endDate) params['endDate'] = endDate;
    return this.api.get<IncomeReport>('/reports/income', params);
  }

  getTreatmentsSummary(startDate?: string, endDate?: string): Observable<TreatmentsSummary> {
    const params: QueryParams = {};
    if (startDate) params['startDate'] = startDate;
    if (endDate) params['endDate'] = endDate;
    return this.api.get<TreatmentsSummary>('/reports/treatments-summary', params);
  }

  getDentistProductivity(startDate?: string, endDate?: string): Observable<DentistProductivity[]> {
    const params: QueryParams = {};
    if (startDate) params['startDate'] = startDate;
    if (endDate) params['endDate'] = endDate;
    return this.api.get<DentistProductivity[]>('/reports/dentist-productivity', params);
  }

  getInventorySummary(): Observable<InventorySummary> {
    return this.api.get<InventorySummary>('/reports/inventory-summary');
  }

  getAppointmentOccupancy(startDate?: string, endDate?: string): Observable<AppointmentOccupancy> {
    const params: QueryParams = {};
    if (startDate) params['startDate'] = startDate;
    if (endDate) params['endDate'] = endDate;
    return this.api.get<AppointmentOccupancy>('/reports/appointment-occupancy', params);
  }

  getTopServices(startDate?: string, endDate?: string, top?: number): Observable<TopService[]> {
    const params: QueryParams = {};
    if (startDate) params['startDate'] = startDate;
    if (endDate) params['endDate'] = endDate;
    if (top) params['top'] = top;
    return this.api.get<TopService[]>('/reports/top-services', params);
  }
}
