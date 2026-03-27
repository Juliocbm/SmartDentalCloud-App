import { Injectable, inject } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import {
  PatientsAnalytics,
  PatientsStatistics,
  PatientAlert,
  PatientListItem,
  PatientBirthday,
  PatientWithBalance,
  AgeGroupData,
  PatientTypeData
} from '../models/patients-analytics.models';

const EMPTY_STATISTICS: PatientsStatistics = {
  totalPatients: 0,
  activePatients: 0,
  inactivePatients: 0,
  newThisMonth: 0,
  newThisWeek: 0,
  averageAge: 0,
  genderDistribution: { male: 0, female: 0, other: 0 }
};

@Injectable({ providedIn: 'root' })
export class PatientsAnalyticsService {
  private api = inject(ApiService);
  private readonly baseUrl = '/patients';

  /**
   * Obtiene todos los datos del dashboard
   */
  getDashboardData(): Observable<PatientsAnalytics> {
    return forkJoin({
      statistics: this.getStatistics(),
      alerts: this.getAlerts(),
      recentPatients: this.getRecentPatients(),
      birthdaysThisMonth: this.getBirthdaysThisMonth(),
      patientsWithBalance: this.getPatientsWithBalance(),
      ageDistribution: this.getAgeDistribution(),
      patientTrend: this.getPatientTrend()
    });
  }

  /**
   * Estadísticas generales de pacientes
   */
  getStatistics(): Observable<PatientsStatistics> {
    return this.api.get<PatientsStatistics>(`${this.baseUrl}/statistics`).pipe(
      catchError(() => of(EMPTY_STATISTICS))
    );
  }

  /**
   * Alertas de pacientes
   */
  getAlerts(): Observable<PatientAlert[]> {
    return this.api.get<PatientAlert[]>(`${this.baseUrl}/alerts`).pipe(
      catchError(() => of([] as PatientAlert[]))
    );
  }

  /**
   * Pacientes registrados recientemente
   */
  getRecentPatients(limit: number = 5): Observable<PatientListItem[]> {
    return this.api.get<PatientListItem[]>(`${this.baseUrl}/recent`, { limit }).pipe(
      catchError(() => of([] as PatientListItem[]))
    );
  }

  /**
   * Cumpleaños del mes
   */
  getBirthdaysThisMonth(): Observable<PatientBirthday[]> {
    return this.api.get<PatientBirthday[]>(`${this.baseUrl}/birthdays`).pipe(
      catchError(() => of([] as PatientBirthday[]))
    );
  }

  /**
   * Pacientes con saldo pendiente
   */
  getPatientsWithBalance(limit: number = 5): Observable<PatientWithBalance[]> {
    return this.api.get<PatientWithBalance[]>(`${this.baseUrl}/with-balance`, { limit }).pipe(
      catchError(() => of([] as PatientWithBalance[]))
    );
  }

  /**
   * Distribución por edad para gráfico
   */
  getAgeDistribution(): Observable<AgeGroupData[]> {
    return this.api.get<AgeGroupData[]>(`${this.baseUrl}/age-distribution`).pipe(
      catchError(() => of([] as AgeGroupData[]))
    );
  }

  /**
   * Tendencia de pacientes nuevos vs recurrentes
   */
  getPatientTrend(months: number = 6): Observable<PatientTypeData[]> {
    return this.api.get<PatientTypeData[]>(`${this.baseUrl}/trend`, { months }).pipe(
      catchError(() => of([] as PatientTypeData[]))
    );
  }

}
