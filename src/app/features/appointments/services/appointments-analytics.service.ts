import { Injectable, inject } from '@angular/core';
import { Observable, map, forkJoin, of, switchMap, catchError } from 'rxjs';
import { AppointmentsService } from './appointments.service';
import { Appointment, AppointmentStatus, AppointmentStatusConfig, AppointmentListItem } from '../models/appointment.models';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
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
  private auditLogService = inject(AuditLogService);

  /**
   * Obtiene las métricas principales del dashboard.
   */
  getDashboardMetrics(locationId?: string | null, rangeStart?: Date, rangeEnd?: Date): Observable<AppointmentDashboardMetrics> {
    const today = new Date();
    const startOfDay = this.startOfDay(today);
    const endOfDay = this.endOfDay(today);
    const startOfWeek = this.startOfWeek(today);
    const endOfWeek = this.endOfWeek(today);
    const statsStart = rangeStart || this.startOfMonth(today);
    const statsEnd = rangeEnd || this.endOfMonth(today);

    return forkJoin({
      todayAppointments: this.appointmentsService.getByRange(startOfDay, endOfDay, undefined, undefined, locationId),
      weekAppointments: this.appointmentsService.getByRange(startOfWeek, endOfWeek, undefined, undefined, locationId),
      monthStats: this.appointmentsService.getStatistics(statsStart, statsEnd)
    }).pipe(
      map(({ todayAppointments, weekAppointments, monthStats }) => {
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
    const start = this.startOfDay(now);
    const end = this.endOfDay(now);

    return this.appointmentsService.getByRange(start, end, undefined, undefined, locationId).pipe(
      map(appointments => {
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
    const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return this.appointmentsService.getByRange(now, sevenDaysAhead, undefined, AppointmentStatus.Scheduled, locationId).pipe(
      map(appointments => {
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

    return this.appointmentsService.getByRange(start, end, undefined, undefined, locationId).pipe(
      map(appointments => {
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

    return this.appointmentsService.getByRange(start, end, undefined, undefined, locationId).pipe(
      map(appointments => {
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
   * Obtiene actividad reciente de citas desde el audit log real.
   *
   * Estrategia:
   *  1. Consulta audit logs filtrados por entityType=Appointment.
   *  2. Resuelve nombres de paciente vía batch fetch de citas.
   *  3. Filtra por locationId si se especifica.
   */
  getRecentActivity(limit: number = 5, locationId?: string | null): Observable<AppointmentActivity[]> {
    return this.auditLogService.getLogs({
      entityType: 'Appointment',
      pageSize: limit * 3
    }).pipe(
      switchMap(logs => {
        const uniqueIds = [...new Set(
          logs.filter(l => l.entityId).map(l => l.entityId!)
        )];

        if (uniqueIds.length === 0) return of([]);

        // Batch-fetch appointment details for patient name resolution
        const fetches: Record<string, Observable<Appointment | null>> = {};
        uniqueIds.forEach(id => {
          fetches[id] = this.appointmentsService.getById(id).pipe(
            catchError(() => of(null))
          );
        });

        return forkJoin(fetches).pipe(
          map(appointmentMap => {
            return logs
              .map(log => {
                if (!log.entityId) return null;
                const apt = appointmentMap[log.entityId];
                if (!apt) return null;
                if (locationId && apt.locationId !== locationId) return null;

                const activityType = this.mapAuditActionToActivityType(log.action);
                return {
                  id: log.id,
                  type: activityType,
                  description: this.getActivityDescription(activityType, apt.patientName),
                  timestamp: new Date(log.createdAt),
                  patientName: apt.patientName,
                  appointmentId: log.entityId
                } as AppointmentActivity;
              })
              .filter((a): a is AppointmentActivity => a !== null)
              .slice(0, limit);
          })
        );
      })
    );
  }

  /**
   * Obtiene pacientes frecuentes basado en número de citas completadas.
   *
   * Estrategia de dos consultas:
   *  - Histórica (últimos 180 días → ahora): conteo de visitas y última visita.
   *  - Futura (ahora → 90 días adelante): próxima cita Scheduled/Confirmed.
   */
  getFrequentPatients(limit: number = 5, locationId?: string | null, startDate?: Date, endDate?: Date): Observable<FrequentPatient[]> {
    const now = new Date();
    const histStart = startDate || new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const histEnd = endDate || now;
    const ninetyDaysAhead = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    return forkJoin({
      historical: this.appointmentsService.getByRange(histStart, histEnd, undefined, undefined, locationId),
      upcoming: this.appointmentsService.getByRange(now, ninetyDaysAhead, undefined, undefined, locationId)
    }).pipe(
      map(({ historical, upcoming }) => {
        // 1. Agrupar citas históricas por paciente
        const patientMap = new Map<string, {
          patientId: string;
          patientName: string;
          appointments: AppointmentListItem[];
        }>();

        historical.forEach(apt => {
          if (!patientMap.has(apt.patientId)) {
            patientMap.set(apt.patientId, {
              patientId: apt.patientId,
              patientName: apt.patientName,
              appointments: []
            });
          }
          patientMap.get(apt.patientId)!.appointments.push(apt);
        });

        // 2. Indexar próxima cita futura por paciente (primera Scheduled/Confirmed)
        const nextAppointmentMap = new Map<string, Date>();

        upcoming
          .filter(a => a.status === AppointmentStatus.Scheduled || a.status === AppointmentStatus.Confirmed)
          .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
          .forEach(apt => {
            if (!nextAppointmentMap.has(apt.patientId)) {
              nextAppointmentMap.set(apt.patientId, new Date(apt.startAt));
            }
          });

        // 3. Construir resultado
        return Array.from(patientMap.values())
          .map(patient => {
            const completed = patient.appointments.filter(a => a.status === AppointmentStatus.Completed);
            const lastCompleted = completed
              .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())[0];

            return {
              patientId: patient.patientId,
              patientName: patient.patientName,
              totalAppointments: patient.appointments.length,
              completedAppointments: completed.length,
              lastVisit: lastCompleted ? new Date(lastCompleted.startAt) : null,
              nextAppointment: nextAppointmentMap.get(patient.patientId) ?? null
            };
          })
          .sort((a, b) => b.completedAppointments - a.completedAppointments)
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

  private mapAuditActionToActivityType(action: string): AppointmentActivityType {
    switch (action) {
      case 'Schedule': return 'created';
      case 'Cancel': return 'cancelled';
      case 'Complete': return 'completed';
      case 'Update': return 'rescheduled';
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
