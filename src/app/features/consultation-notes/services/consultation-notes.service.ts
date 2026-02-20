import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  ConsultationNote,
  CreateConsultationNoteRequest,
  UpdateConsultationNoteRequest
} from '../models/consultation-note.models';
import { Appointment } from '../../appointments/models/appointment.models';

@Injectable()
export class ConsultationNotesService {
  private api = inject(ApiService);

  getByAppointment(appointmentId: string): Observable<ConsultationNote> {
    return this.api.get<ConsultationNote>(`/consultationnotes/by-appointment/${appointmentId}`);
  }

  create(request: CreateConsultationNoteRequest): Observable<ConsultationNote> {
    return this.api.post<ConsultationNote>('/consultationnotes', request);
  }

  update(id: string, request: UpdateConsultationNoteRequest): Observable<void> {
    return this.api.put<void>(`/consultationnotes/${id}`, request);
  }

  // Fetch completed appointments to show in the list
  getCompletedAppointments(): Observable<Appointment[]> {
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    return this.api.get<Appointment[]>('/appointments/range', {
      startDate: oneYearAgo.toISOString(),
      endDate: now.toISOString(),
      status: 'Completed'
    }).pipe(
      map(appointments => appointments.map(apt => ({
        ...apt,
        startAt: new Date(apt.startAt),
        endAt: new Date(apt.endAt),
        createdAt: new Date(apt.createdAt)
      })))
    );
  }
}
