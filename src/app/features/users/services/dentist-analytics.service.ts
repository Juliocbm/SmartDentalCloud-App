import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, catchError, of } from 'rxjs';
import { UsersService } from './users.service';
import { ReportsService } from '../../reports/services/reports.service';
import { User } from '../models/user.models';
import { DentistProductivity, AppointmentOccupancy } from '../../reports/models/report.models';
import { ChartDataItem } from '../../../shared/components/charts';
import {
  DentistDashboardMetrics,
  DentistRanking,
  DentistTeamMember,
  DentistIndividualMetrics
} from '../models/dentist-analytics.models';

/**
 * Servicio de analytics para el dashboard de dentistas.
 * Compone datos de UsersService y ReportsService para generar
 * métricas, rankings y datos de gráficos.
 */
@Injectable()
export class DentistAnalyticsService {
  private usersService = inject(UsersService);
  private reportsService = inject(ReportsService);

  /**
   * Carga todos los datos base del dashboard.
   * Retorna dentistas y productividad del mes actual.
   */
  loadDashboardData(startDate: string, endDate: string): Observable<{ dentists: User[]; productivity: DentistProductivity[] }> {
    return forkJoin({
      users: this.usersService.getAll(),
      productivity: this.reportsService.getDentistProductivity(startDate, endDate).pipe(
        catchError(() => of([] as DentistProductivity[]))
      )
    }).pipe(
      map(({ users, productivity }) => {
        const dentists = users.filter(user =>
          user.roles.some(r => r.name === 'Dentista')
        );
        return { dentists, productivity };
      })
    );
  }

  /**
   * Calcula las métricas KPI del dashboard.
   */
  computeMetrics(dentists: User[], productivity: DentistProductivity[]): DentistDashboardMetrics {
    const totalDentists = dentists.length;
    const activeDentists = dentists.filter(d => d.isActive).length;
    const appointmentsCompleted = productivity.reduce((sum, p) => sum + p.appointmentsCompleted, 0);
    const appointmentsCancelled = productivity.reduce((sum, p) => sum + p.appointmentsCancelled, 0);
    const treatmentsCompleted = productivity.reduce((sum, p) => sum + p.treatmentsCompleted, 0);
    const totalRevenue = productivity.reduce((sum, p) => sum + p.revenueGenerated, 0);

    const totalAppointments = appointmentsCompleted + appointmentsCancelled;
    const completionRate = totalAppointments > 0
      ? Math.round((appointmentsCompleted / totalAppointments) * 100 * 10) / 10
      : 0;
    const avgRevenuePerDentist = activeDentists > 0
      ? Math.round(totalRevenue / activeDentists)
      : 0;

    return {
      totalDentists,
      activeDentists,
      appointmentsCompleted,
      appointmentsCancelled,
      treatmentsCompleted,
      totalRevenue,
      completionRate,
      avgRevenuePerDentist
    };
  }

  /**
   * Genera datos para gráfico de barras: Ingresos por Dentista.
   */
  getRevenueChartData(dentists: User[], productivity: DentistProductivity[]): ChartDataItem[] {
    const prodMap = new Map(productivity.map(p => [p.dentistId, p]));
    return dentists
      .filter(d => d.isActive)
      .map(d => ({
        label: this.truncateName(d.name),
        value: prodMap.get(d.id)?.revenueGenerated ?? 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }

  /**
   * Genera datos para gráfico de barras: Citas por Dentista.
   */
  getAppointmentsChartData(dentists: User[], productivity: DentistProductivity[]): ChartDataItem[] {
    const prodMap = new Map(productivity.map(p => [p.dentistId, p]));
    return dentists
      .filter(d => d.isActive)
      .map(d => ({
        label: this.truncateName(d.name),
        value: prodMap.get(d.id)?.appointmentsCompleted ?? 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }

  /**
   * Ranking de dentistas por ingresos generados.
   */
  getTopByRevenue(dentists: User[], productivity: DentistProductivity[], limit: number = 5): DentistRanking[] {
    const prodMap = new Map(productivity.map(p => [p.dentistId, p]));
    return dentists
      .filter(d => d.isActive)
      .map(d => {
        const prod = prodMap.get(d.id);
        return {
          dentistId: d.id,
          dentistName: d.name,
          value: prod?.revenueGenerated ?? 0,
          secondaryValue: prod?.treatmentsCompleted ?? 0,
          subtitle: `${prod?.treatmentsCompleted ?? 0} tratamientos · ${prod?.appointmentsCompleted ?? 0} citas`
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  }

  /**
   * Ranking de dentistas por tratamientos completados.
   */
  getTopByTreatments(dentists: User[], productivity: DentistProductivity[], limit: number = 5): DentistRanking[] {
    const prodMap = new Map(productivity.map(p => [p.dentistId, p]));
    return dentists
      .filter(d => d.isActive)
      .map(d => {
        const prod = prodMap.get(d.id);
        return {
          dentistId: d.id,
          dentistName: d.name,
          value: prod?.treatmentsCompleted ?? 0,
          secondaryValue: prod?.avgAppointmentDuration ?? 0,
          subtitle: `${prod?.appointmentsCompleted ?? 0} citas · ${Math.round(prod?.avgAppointmentDuration ?? 0)} min prom.`
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  }

  /**
   * Lista del equipo de dentistas con datos de productividad del mes.
   */
  getTeamList(dentists: User[], productivity: DentistProductivity[]): DentistTeamMember[] {
    const prodMap = new Map(productivity.map(p => [p.dentistId, p]));

    return [...dentists]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(d => {
        const prod = prodMap.get(d.id);
        return {
          id: d.id,
          name: d.name,
          specialty: d.profile?.specialty || 'Sin especialidad',
          isActive: d.isActive,
          appointmentsThisMonth: prod?.appointmentsCompleted ?? 0,
          revenueThisMonth: prod?.revenueGenerated ?? 0
        };
      });
  }

  /**
   * Trunca nombres largos para labels de gráficos.
   */
  private truncateName(name: string, maxLength: number = 18): string {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '…';
  }

  /**
   * Obtiene métricas individuales de un dentista específico.
   */
  getIndividualMetrics(
    dentist: User,
    productivity: DentistProductivity[],
    occupancy: AppointmentOccupancy | null
  ): DentistIndividualMetrics {
    const prod = productivity.find(p => p.dentistId === dentist.id);
    const occ = occupancy?.byDentist.find(o => o.dentistId === dentist.id);
    const completed = prod?.appointmentsCompleted ?? 0;
    const cancelled = prod?.appointmentsCancelled ?? 0;
    const total = completed + cancelled;
    return {
      dentistId: dentist.id,
      dentistName: dentist.name,
      specialty: dentist.profile?.specialty || 'Sin especialidad',
      appointmentsCompleted: completed,
      appointmentsCancelled: cancelled,
      noShowCount: occ?.cancelled ?? 0,
      occupancyRate: occ?.occupancyRate ?? 0,
      completionRate: total > 0 ? Math.round((completed / total) * 100 * 10) / 10 : 0,
      revenue: prod?.revenueGenerated ?? 0,
      treatmentsCompleted: prod?.treatmentsCompleted ?? 0
    };
  }

  /**
   * Carga datos de ocupación por dentista.
   */
  loadOccupancyData(startDate: string, endDate: string): Observable<AppointmentOccupancy | null> {
    return this.reportsService.getAppointmentOccupancy(startDate, endDate).pipe(
      catchError(() => of(null))
    );
  }
}
