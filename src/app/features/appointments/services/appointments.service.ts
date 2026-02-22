import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService, QueryParams } from '../../../core/services/api.service';
import {
  Appointment,
  CreateAppointmentRequest,
  RescheduleAppointmentRequest,
  UpdateAppointmentNotesRequest,
  CancelAppointmentRequest,
  AppointmentFilters,
  TimeSlot,
  AppointmentStatistics,
  AppointmentListItem,
  AppointmentStatusConfig
} from '../models/appointment.models';

@Injectable()
export class AppointmentsService {
  private api = inject(ApiService);

  getById(id: string): Observable<Appointment> {
    return this.api.get<Appointment>(`/appointments/${id}`).pipe(
      map(apt => this.mapDates(apt))
    );
  }

  create(request: CreateAppointmentRequest): Observable<Appointment> {
    return this.api.post<Appointment>('/appointments', {
      ...request,
      startAt: request.startAt.toISOString(),
      endAt: request.endAt.toISOString()
    }).pipe(
      map(apt => this.mapDates(apt))
    );
  }

  reschedule(id: string, request: RescheduleAppointmentRequest): Observable<void> {
    return this.api.patch<void>(`/appointments/${id}/reschedule`, {
      newStartAt: request.newStartAt.toISOString(),
      newEndAt: request.newEndAt.toISOString()
    });
  }

  cancel(id: string, reason?: string): Observable<void> {
    return this.api.patch<void>(`/appointments/${id}/cancel`, { 
      cancellationReason: reason 
    });
  }

  complete(id: string): Observable<void> {
    return this.api.patch<void>(`/appointments/${id}/complete`, {});
  }

  markAsNoShow(id: string): Observable<void> {
    return this.api.patch<void>(`/appointments/${id}/no-show`, {});
  }

  updateNotes(id: string, notes: string): Observable<void> {
    return this.api.patch<void>(`/appointments/${id}/notes`, { notes });
  }

  getByDate(date: Date, userId?: string): Observable<AppointmentListItem[]> {
    return this.api.get<Appointment[]>('/appointments', {
      date: date.toISOString(),
      userId
    }).pipe(
      map(appointments => appointments.map(apt => this.toListItem(this.mapDates(apt))))
    );
  }

  getByPatient(patientId: string): Observable<AppointmentListItem[]> {
    return this.api.get<Appointment[]>(`/appointments/patient/${patientId}`).pipe(
      map(appointments => appointments.map(apt => this.toListItem(this.mapDates(apt))))
    );
  }

  getMyAppointments(startDate?: Date, endDate?: Date): Observable<AppointmentListItem[]> {
    const params: QueryParams = {};
    if (startDate) params['startDate'] = startDate.toISOString();
    if (endDate) params['endDate'] = endDate.toISOString();
    
    return this.api.get<Appointment[]>('/appointments/my-appointments', params).pipe(
      map(appointments => appointments.map(apt => this.toListItem(this.mapDates(apt))))
    );
  }

  getByRange(startDate: Date, endDate: Date, userId?: string, status?: string): Observable<AppointmentListItem[]> {
    return this.api.get<Appointment[]>('/appointments/range', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      userId,
      status
    }).pipe(
      map(appointments => appointments.map(apt => this.toListItem(this.mapDates(apt))))
    );
  }

  getUpcoming(limit: number = 10, userId?: string): Observable<AppointmentListItem[]> {
    return this.api.get<Appointment[]>('/appointments/upcoming', {
      limit,
      userId
    }).pipe(
      map(appointments => appointments.map(apt => this.toListItem(this.mapDates(apt))))
    );
  }

  getAvailability(date: Date, userId?: string, durationMinutes: number = 60): Observable<TimeSlot[]> {
    return this.api.get<{ startTime: string; endTime: string; isAvailable: boolean }[]>('/appointments/availability', {
      date: date.toISOString(),
      userId,
      durationMinutes
    }).pipe(
      map(slots => slots.map(slot => ({
        start: new Date(slot.startTime),
        end: new Date(slot.endTime),
        available: slot.isAvailable
      })))
    );
  }

  getStatistics(startDate?: Date, endDate?: Date, userId?: string): Observable<AppointmentStatistics> {
    const params: QueryParams = {};
    if (startDate) params['startDate'] = startDate.toISOString();
    if (endDate) params['endDate'] = endDate.toISOString();
    if (userId) params['userId'] = userId;

    return this.api.get<AppointmentStatistics>('/appointments/statistics', params);
  }

  private mapDates(appointment: Appointment): Appointment {
    return {
      ...appointment,
      startAt: new Date(appointment.startAt),
      endAt: new Date(appointment.endAt),
      createdAt: new Date(appointment.createdAt)
    };
  }

  private toListItem(appointment: Appointment): AppointmentListItem {
    const config = AppointmentStatusConfig[appointment.status];
    const duration = (appointment.endAt.getTime() - appointment.startAt.getTime()) / (1000 * 60);
    
    return {
      ...appointment,
      displayTime: this.formatTime(appointment.startAt),
      displayDate: this.formatDate(appointment.startAt),
      statusColor: config.color,
      statusLabel: config.label,
      durationMinutes: duration
    };
  }

  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    }).format(date);
  }
}
