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
      startAt: this.toLocalDateTimeString(request.startAt),
      endAt: this.toLocalDateTimeString(request.endAt)
    }).pipe(
      map(apt => this.mapDates(apt))
    );
  }

  reschedule(id: string, request: RescheduleAppointmentRequest): Observable<void> {
    return this.api.patch<void>(`/appointments/${id}/reschedule`, {
      newStartAt: this.toLocalDateTimeString(request.newStartAt),
      newEndAt: this.toLocalDateTimeString(request.newEndAt)
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

  confirm(id: string): Observable<void> {
    return this.api.patch<void>(`/appointments/${id}/confirm`, {});
  }

  markAsNoShow(id: string): Observable<void> {
    return this.api.patch<void>(`/appointments/${id}/no-show`, {});
  }

  updateNotes(id: string, notes: string): Observable<void> {
    return this.api.patch<void>(`/appointments/${id}/notes`, { notes });
  }

  getByDate(date: Date, userId?: string): Observable<AppointmentListItem[]> {
    return this.api.get<Appointment[]>('/appointments', {
      date: this.toLocalDateString(date),
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
    if (startDate) params['startDate'] = this.toLocalDateTimeString(startDate);
    if (endDate) params['endDate'] = this.toLocalDateTimeString(endDate);
    
    return this.api.get<Appointment[]>('/appointments/my-appointments', params).pipe(
      map(appointments => appointments.map(apt => this.toListItem(this.mapDates(apt))))
    );
  }

  getByRange(startDate: Date, endDate: Date, userId?: string, status?: string): Observable<AppointmentListItem[]> {
    return this.api.get<Appointment[]>('/appointments/range', {
      startDate: this.toLocalDateTimeString(startDate),
      endDate: this.toLocalDateTimeString(endDate),
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

  getAvailability(date: Date, userId?: string, durationMinutes: number = 60, locationId?: string | null): Observable<TimeSlot[]> {
    const localDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const params: Record<string, any> = { date: localDate, userId, durationMinutes };
    if (locationId) params['locationId'] = locationId;
    return this.api.get<{ startTime: string; endTime: string; isAvailable: boolean }[]>('/appointments/availability', params).pipe(
      map(slots => slots.map(slot => ({
        start: new Date(slot.startTime),
        end: new Date(slot.endTime),
        available: slot.isAvailable
      })))
    );
  }

  getStatistics(startDate?: Date, endDate?: Date, userId?: string): Observable<AppointmentStatistics> {
    const params: QueryParams = {};
    if (startDate) params['startDate'] = this.toLocalDateString(startDate);
    if (endDate) params['endDate'] = this.toLocalDateString(endDate);
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

  private toLocalDateTimeString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d}T${h}:${min}:${s}`;
  }

  private toLocalDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
