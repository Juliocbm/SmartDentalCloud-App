import { Injectable, inject } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
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

/**
 * Servicio de analytics para el dashboard de pacientes
 */
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
      catchError(() => of(this.getMockStatistics()))
    );
  }

  /**
   * Alertas de pacientes
   */
  getAlerts(): Observable<PatientAlert[]> {
    return this.api.get<PatientAlert[]>(`${this.baseUrl}/alerts`).pipe(
      catchError(() => of(this.getMockAlerts()))
    );
  }

  /**
   * Pacientes registrados recientemente
   */
  getRecentPatients(limit: number = 5): Observable<PatientListItem[]> {
    return this.api.get<PatientListItem[]>(`${this.baseUrl}/recent`, { limit }).pipe(
      catchError(() => of(this.getMockRecentPatients()))
    );
  }

  /**
   * Cumpleaños del mes
   */
  getBirthdaysThisMonth(): Observable<PatientBirthday[]> {
    return this.api.get<PatientBirthday[]>(`${this.baseUrl}/birthdays`).pipe(
      catchError(() => of(this.getMockBirthdays()))
    );
  }

  /**
   * Pacientes con saldo pendiente
   */
  getPatientsWithBalance(limit: number = 5): Observable<PatientWithBalance[]> {
    return this.api.get<PatientWithBalance[]>(`${this.baseUrl}/with-balance`, { limit }).pipe(
      catchError(() => of(this.getMockPatientsWithBalance()))
    );
  }

  /**
   * Distribución por edad para gráfico
   */
  getAgeDistribution(): Observable<AgeGroupData[]> {
    return this.api.get<AgeGroupData[]>(`${this.baseUrl}/age-distribution`).pipe(
      catchError(() => of(this.getMockAgeDistribution()))
    );
  }

  /**
   * Tendencia de pacientes nuevos vs recurrentes
   */
  getPatientTrend(months: number = 6): Observable<PatientTypeData[]> {
    return this.api.get<PatientTypeData[]>(`${this.baseUrl}/trend`, { months }).pipe(
      catchError(() => of(this.getMockPatientTrend()))
    );
  }

  // === Mock Data para desarrollo ===

  private getMockStatistics(): PatientsStatistics {
    return {
      totalPatients: 1247,
      activePatients: 1089,
      inactivePatients: 158,
      newThisMonth: 47,
      newThisWeek: 12,
      averageAge: 34.5,
      genderDistribution: {
        male: 542,
        female: 689,
        other: 16
      }
    };
  }

  private getMockAlerts(): PatientAlert[] {
    const now = new Date();
    return [
      {
        id: '1',
        type: 'no_recent_appointment',
        patientId: 'p1',
        patientName: 'María García López',
        message: 'Sin cita en los últimos 6 meses',
        severity: 'medium',
        date: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
      },
      {
        id: '2',
        type: 'pending_balance',
        patientId: 'p2',
        patientName: 'Juan Pérez Martínez',
        message: 'Saldo pendiente: $2,450.00',
        severity: 'high',
        date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      },
      {
        id: '3',
        type: 'birthday_today',
        patientId: 'p3',
        patientName: 'Ana Rodríguez Sánchez',
        message: 'Cumple 35 años hoy',
        severity: 'low',
        date: now
      },
      {
        id: '4',
        type: 'pending_treatment',
        patientId: 'p4',
        patientName: 'Carlos Hernández',
        message: 'Tratamiento de ortodoncia pendiente',
        severity: 'medium',
        date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)
      }
    ];
  }

  private getMockRecentPatients(): PatientListItem[] {
    const now = new Date();
    return [
      {
        id: 'p1',
        fullName: 'Roberto Sánchez Gómez',
        email: 'roberto.sanchez@email.com',
        phone: '+52 55 1234 5678',
        lastVisit: null,
        nextAppointment: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        pendingBalance: 0,
        isActive: true
      },
      {
        id: 'p2',
        fullName: 'Laura Martínez Ruiz',
        email: 'laura.martinez@email.com',
        phone: '+52 55 2345 6789',
        lastVisit: null,
        nextAppointment: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        pendingBalance: 0,
        isActive: true
      },
      {
        id: 'p3',
        fullName: 'Fernando López Díaz',
        email: 'fernando.lopez@email.com',
        phone: '+52 55 3456 7890',
        lastVisit: null,
        nextAppointment: null,
        pendingBalance: 0,
        isActive: true
      },
      {
        id: 'p4',
        fullName: 'Patricia Moreno Castro',
        email: 'patricia.moreno@email.com',
        phone: '+52 55 4567 8901',
        lastVisit: null,
        nextAppointment: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        pendingBalance: 0,
        isActive: true
      },
      {
        id: 'p5',
        fullName: 'Miguel Ángel Torres',
        email: 'miguel.torres@email.com',
        phone: '+52 55 5678 9012',
        lastVisit: null,
        nextAppointment: null,
        pendingBalance: 0,
        isActive: true
      }
    ];
  }

  private getMockBirthdays(): PatientBirthday[] {
    const now = new Date();
    return [
      {
        id: 'p1',
        fullName: 'Ana Rodríguez Sánchez',
        dateOfBirth: new Date(1990, now.getMonth(), now.getDate()),
        age: 35,
        daysUntilBirthday: 0,
        phone: '+52 55 1111 2222'
      },
      {
        id: 'p2',
        fullName: 'Carlos Mendoza Ríos',
        dateOfBirth: new Date(1985, now.getMonth(), now.getDate() + 3),
        age: 39,
        daysUntilBirthday: 3,
        phone: '+52 55 3333 4444'
      },
      {
        id: 'p3',
        fullName: 'Elena Vargas Luna',
        dateOfBirth: new Date(1992, now.getMonth(), now.getDate() + 7),
        age: 32,
        daysUntilBirthday: 7,
        phone: '+52 55 5555 6666'
      },
      {
        id: 'p4',
        fullName: 'Ricardo Flores Paz',
        dateOfBirth: new Date(1978, now.getMonth(), now.getDate() + 12),
        age: 46,
        daysUntilBirthday: 12,
        phone: '+52 55 7777 8888'
      }
    ];
  }

  private getMockPatientsWithBalance(): PatientWithBalance[] {
    return [
      {
        id: 'p1',
        fullName: 'Juan Pérez Martínez',
        pendingBalance: 4500.00,
        lastPaymentDate: new Date(2025, 10, 15),
        daysSinceLastPayment: 45
      },
      {
        id: 'p2',
        fullName: 'María González Torres',
        pendingBalance: 2850.00,
        lastPaymentDate: new Date(2025, 11, 1),
        daysSinceLastPayment: 30
      },
      {
        id: 'p3',
        fullName: 'Pedro Ramírez Soto',
        pendingBalance: 1200.00,
        lastPaymentDate: new Date(2025, 11, 20),
        daysSinceLastPayment: 11
      },
      {
        id: 'p4',
        fullName: 'Lucía Herrera Vega',
        pendingBalance: 980.00,
        lastPaymentDate: null,
        daysSinceLastPayment: null
      },
      {
        id: 'p5',
        fullName: 'Andrés Silva Mora',
        pendingBalance: 750.00,
        lastPaymentDate: new Date(2025, 11, 25),
        daysSinceLastPayment: 6
      }
    ];
  }

  private getMockAgeDistribution(): AgeGroupData[] {
    return [
      { ageGroup: '0-17', count: 156, percentage: 12.5 },
      { ageGroup: '18-25', count: 187, percentage: 15.0 },
      { ageGroup: '26-35', count: 312, percentage: 25.0 },
      { ageGroup: '36-45', count: 274, percentage: 22.0 },
      { ageGroup: '46-55', count: 187, percentage: 15.0 },
      { ageGroup: '56-65', count: 94, percentage: 7.5 },
      { ageGroup: '65+', count: 37, percentage: 3.0 }
    ];
  }

  private getMockPatientTrend(): PatientTypeData[] {
    return [
      { period: 'Sep', newPatients: 28, recurringPatients: 145 },
      { period: 'Oct', newPatients: 35, recurringPatients: 162 },
      { period: 'Nov', newPatients: 42, recurringPatients: 178 },
      { period: 'Dic', newPatients: 31, recurringPatients: 156 },
      { period: 'Ene', newPatients: 38, recurringPatients: 189 },
      { period: 'Feb', newPatients: 47, recurringPatients: 201 }
    ];
  }
}
