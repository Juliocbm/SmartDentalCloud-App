import { Injectable, inject } from '@angular/core';
import { Observable, map, forkJoin, of } from 'rxjs';
import { AppointmentsService } from './appointments.service';
import { AppointmentStatus, AppointmentStatusConfig, AppointmentListItem } from '../models/appointment.models';
import {
  UpcomingAppointment,
  PendingConfirmation,
  StatusDistribution,
  WeekdayDistribution,
  AppointmentActivity,
  AppointmentActivityType,
  FrequentPatient,
  AppointmentDashboardMetrics,
  APPOINTMENT_ACTIVITY_CONFIG
} from '../models/appointments-analytics.models';

/**
 * Servicio de analytics para el dashboard de citas.
 * Proporciona métricas, distribuciones y listas procesadas.
 */
@Injectable()
export class AppointmentsAnalyticsService {
  private appointmentsService = inject(AppointmentsService);

  /**
   * Obtiene las métricas principales del dashboard.
   */
  getDashboardMetrics(locationId?: string | null): Observable<AppointmentDashboardMetrics> {
    const today = new Date();
    const startOfDay = this.startOfDay(today);
    const endOfDay = this.endOfDay(today);
    const startOfWeek = this.startOfWeek(today);
    const endOfWeek = this.endOfWeek(today);
    const startOfMonth = this.startOfMonth(today);
    const endOfMonth = this.endOfMonth(today);

    return forkJoin({
      todayAppointments: this.appointmentsService.getByRange(startOfDay, endOfDay),
      weekAppointments: this.appointmentsService.getByRange(startOfWeek, endOfWeek),
      monthStats: this.appointmentsService.getStatistics(startOfMonth, endOfMonth)
    }).pipe(
      map(({ todayAppointments, weekAppointments, monthStats }) => {
        if (locationId) {
          todayAppointments = todayAppointments.filter(a => a.locationId === locationId);
          weekAppointments = weekAppointments.filter(a => a.locationId === locationId);
        }
        const todayCompleted = todayAppointments.filter(a => a.status === AppointmentStatus.Completed).length;
        const todayPending = todayAppointments.filter(a => 
          a.status === AppointmentStatus.Scheduled || a.status === AppointmentStatus.Confirmed
        ).length;
        const weekCompleted = weekAppointments.filter(a => a.status === AppointmentStatus.Completed).length;
        const pendingConfirmations = todayAppointments.filter(a => a.status === AppointmentStatus.Scheduled).length;

        return {
          todayTotal: todayAppointments.length,
          todayCompleted,
          todayPending,
          weekTotal: weekAppointments.length,
          weekCompleted,
          pendingConfirmations,
          noShowsThisMonth: monthStats.noShow,
          completionRateMonth: monthStats.completionRate
        };
      })
    );
  }

  /**
   * Obtiene las próximas citas del día.
   */
  getUpcomingToday(limit: number = 5, locationId?: string | null): Observable<UpcomingAppointment[]> {
    const now = new Date();
    const endOfDay = this.endOfDay(now);

    return this.appointmentsService.getByRange(now, endOfDay).pipe(
      map(appointments => {
        if (locationId) appointments = appointments.filter(a => a.locationId === locationId);
        return appointments
          .filter(a => a.status === AppointmentStatus.Scheduled || a.status === AppointmentStatus.Confirmed)
          .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
          .slice(0, limit)
          .map(apt => this.toUpcomingAppointment(apt));
      })
    );
  }

  /**
   * Obtiene citas pendientes de confirmar.
   */
  getPendingConfirmations(limit: number = 5, locationId?: string | null): Observable<PendingConfirmation[]> {
    const now = new Date();
    const endOfWeek = this.endOfWeek(now);

    return this.appointmentsService.getByRange(now, endOfWeek, undefined, AppointmentStatus.Scheduled).pipe(
      map(appointments => {
        if (locationId) appointments = appointments.filter(a => a.locationId === locationId);
        return appointments
          .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
          .slice(0, limit)
          .map(apt => this.toPendingConfirmation(apt));
      })
    );
  }

  /**
   * Obtiene la distribución de citas por estado en un rango.
   */
  getStatusDistribution(startDate?: Date, endDate?: Date, locationId?: string | null): Observable<StatusDistribution[]> {
    const start = startDate || this.startOfMonth(new Date());
    const end = endDate || this.endOfMonth(new Date());

    return this.appointmentsService.getByRange(start, end).pipe(
      map(appointments => {
        if (locationId) appointments = appointments.filter(a => a.locationId === locationId);
        const statusCounts = new Map<AppointmentStatus, number>();
        
        appointments.forEach(apt => {
          const count = statusCounts.get(apt.status) || 0;
          statusCounts.set(apt.status, count + 1);
        });

        return Object.values(AppointmentStatus).map(status => ({
          status,
          label: AppointmentStatusConfig[status].label,
          count: statusCounts.get(status) || 0,
          color: AppointmentStatusConfig[status].color
        }));
      })
    );
  }

  /**
   * Obtiene la distribución de citas por día de la semana.
   */
  getWeekdayDistribution(startDate?: Date, endDate?: Date, locationId?: string | null): Observable<WeekdayDistribution[]> {
    const start = startDate || this.startOfMonth(new Date());
    const end = endDate || this.endOfMonth(new Date());
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    return this.appointmentsService.getByRange(start, end).pipe(
      map(appointments => {
        if (locationId) appointments = appointments.filter(a => a.locationId === locationId);
        const dayCounts = new Array(7).fill(0);
        
        appointments.forEach(apt => {
          const dayOfWeek = new Date(apt.startAt).getDay();
          dayCounts[dayOfWeek]++;
        });

        return dayCounts.map((count, index) => ({
          dayName: dayNames[index],
          dayNumber: index,
          count
        }));
      })
    );
  }

  /**
   * Obtiene actividad reciente de citas (simulada basada en citas recientes).
   */
  getRecentActivity(limit: number = 5, locationId?: string | null): Observable<AppointmentActivity[]> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return this.appointmentsService.getByRange(weekAgo, now).pipe(
      map(appointments => {
        if (locationId) appointments = appointments.filter(a => a.locationId === locationId);
        const activities: AppointmentActivity[] = [];

        appointments.forEach(apt => {
          const activityType = this.getActivityType(apt.status);
          activities.push({
            id: `${apt.id}-${activityType}`,
            type: activityType,
            description: this.getActivityDescription(activityType, apt.patientName),
            timestamp: new Date(apt.createdAt),
            patientName: apt.patientName,
            appointmentId: apt.id
          });
        });

        return activities
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, limit);
      })
    );
  }

  /**
   * Obtiene pacientes frecuentes basado en número de citas.
   */
  getFrequentPatients(limit: number = 5, locationId?: string | null): Observable<FrequentPatient[]> {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    return this.appointmentsService.getByRange(sixMonthsAgo, now).pipe(
      map(appointments => {
        if (locationId) appointments = appointments.filter(a => a.locationId === locationId);
        const patientMap = new Map<string, {
          patientId: string;
          patientName: string;
          appointments: AppointmentListItem[];
        }>();

        appointments.forEach(apt => {
          if (!patientMap.has(apt.patientId)) {
            patientMap.set(apt.patientId, {
              patientId: apt.patientId,
              patientName: apt.patientName,
              appointments: []
            });
          }
          patientMap.get(apt.patientId)!.appointments.push(apt);
        });

        return Array.from(patientMap.values())
          .map(patient => {
            const completed = patient.appointments.filter(a => a.status === AppointmentStatus.Completed);
            const sortedByDate = [...patient.appointments].sort((a, b) => 
              new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
            );
            const lastCompleted = completed.sort((a, b) => 
              new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
            )[0];
            const upcoming = sortedByDate.find(a => 
              new Date(a.startAt) > now && 
              (a.status === AppointmentStatus.Scheduled || a.status === AppointmentStatus.Confirmed)
            );

            return {
              patientId: patient.patientId,
              patientName: patient.patientName,
              totalAppointments: patient.appointments.length,
              completedAppointments: completed.length,
              lastVisit: lastCompleted ? new Date(lastCompleted.startAt) : null,
              nextAppointment: upcoming ? new Date(upcoming.startAt) : null
            };
          })
          .sort((a, b) => b.totalAppointments - a.totalAppointments)
          .slice(0, limit);
      })
    );
  }

  // === Helpers ===

  private toUpcomingAppointment(apt: AppointmentListItem): UpcomingAppointment {
    return {
      id: apt.id,
      patientName: apt.patientName,
      doctorName: apt.doctorName,
      startAt: new Date(apt.startAt),
      endAt: new Date(apt.endAt),
      reason: apt.reason,
      status: apt.status,
      displayTime: apt.displayTime,
      statusColor: apt.statusColor,
      statusLabel: apt.statusLabel
    };
  }

  private toPendingConfirmation(apt: AppointmentListItem): PendingConfirmation {
    const now = new Date();
    const startAt = new Date(apt.startAt);
    const hoursUntil = Math.round((startAt.getTime() - now.getTime()) / (1000 * 60 * 60));

    return {
      id: apt.id,
      patientName: apt.patientName,
      doctorName: apt.doctorName,
      startAt,
      reason: apt.reason,
      displayTime: apt.displayTime,
      displayDate: apt.displayDate,
      hoursUntil
    };
  }

  private getActivityType(status: AppointmentStatus): AppointmentActivityType {
    switch (status) {
      case AppointmentStatus.Scheduled: return 'created';
      case AppointmentStatus.Confirmed: return 'confirmed';
      case AppointmentStatus.Completed: return 'completed';
      case AppointmentStatus.Cancelled: return 'cancelled';
      case AppointmentStatus.NoShow: return 'no_show';
      default: return 'created';
    }
  }

  private getActivityDescription(type: AppointmentActivityType, patientName: string): string {
    switch (type) {
      case 'created': return `Nueva cita programada para ${patientName}`;
      case 'confirmed': return `Cita confirmada: ${patientName}`;
      case 'completed': return `Cita completada: ${patientName}`;
      case 'cancelled': return `Cita cancelada: ${patientName}`;
      case 'rescheduled': return `Cita reagendada: ${patientName}`;
      case 'no_show': return `No asistió: ${patientName}`;
      default: return `Actividad: ${patientName}`;
    }
  }

  // === Date Utilities ===

  private startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private endOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  private startOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private endOfWeek(date: Date): Date {
    const d = this.startOfWeek(date);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  private startOfMonth(date: Date): Date {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private endOfMonth(date: Date): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + 1, 0);
    d.setHours(23, 59, 59, 999);
    return d;
  }
}
