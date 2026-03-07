import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, catchError, of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  DashboardData,
  DashboardAppointment,
  DashboardTreatment,
  DashboardTreatmentPlan,
  DashboardIncome,
  DashboardInventory
} from '../models/dashboard.models';

@Injectable()
export class DashboardService {
  private api = inject(ApiService);

  loadDashboardData(locationId?: string | null): Observable<DashboardData> {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const todayStr = this.toLocalDateString(today);
    const startOfMonthStr = this.toLocalDateString(startOfMonth);

    const appointmentParams: Record<string, any> = { date: todayStr };
    const upcomingParams: Record<string, any> = { limit: 8 };
    const inventoryParams: Record<string, any> = {};
    if (locationId) {
      appointmentParams['locationId'] = locationId;
      upcomingParams['locationId'] = locationId;
      inventoryParams['locationId'] = locationId;
    }

    return forkJoin({
      todayAppointments: this.api.get<DashboardAppointment[]>('/appointments', appointmentParams).pipe(
        catchError(() => of([] as DashboardAppointment[]))
      ),

      upcomingAppointments: this.api.get<DashboardAppointment[]>('/appointments/upcoming', upcomingParams).pipe(
        catchError(() => of([] as DashboardAppointment[]))
      ),

      treatments: this.api.get<DashboardTreatment[]>('/treatments', {
        status: 'InProgress',
        limit: 50
      }).pipe(
        catchError(() => of([] as DashboardTreatment[]))
      ),

      treatmentPlans: this.api.get<DashboardTreatmentPlan[]>('/treatment-plans', {
        status: 'Draft,PendingApproval',
        limit: 20
      }).pipe(
        catchError(() => of([] as DashboardTreatmentPlan[]))
      ),

      income: this.api.get<DashboardIncome>('/reports/income', {
        startDate: startOfMonthStr,
        endDate: todayStr
      }).pipe(
        catchError(() => of({ totalIncome: 0, totalPending: 0, invoiceCount: 0, paymentCount: 0 }))
      ),

      inventory: this.api.get<DashboardInventory>('/reports/inventory-summary', inventoryParams).pipe(
        catchError(() => of({ totalProducts: 0, lowStockProducts: 0, outOfStockProducts: 0, lowStockItems: [] }))
      )
    });
  }

  private toLocalDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
