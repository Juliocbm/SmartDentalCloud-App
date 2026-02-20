import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Treatment, CreateTreatmentRequest, UpdateTreatmentRequest } from '../models/treatment.models';
import { TreatmentFollowUp, CreateFollowUpRequest, UpdateFollowUpRequest } from '../models/treatment-followup.models';

@Injectable()
export class TreatmentsService {
  private api = inject(ApiService);

  getAll(): Observable<Treatment[]> {
    return this.api.get<Treatment[]>('/treatments');
  }

  getById(id: string): Observable<Treatment> {
    return this.api.get<Treatment>(`/treatments/${id}`);
  }

  getByPatient(patientId: string): Observable<Treatment[]> {
    return this.api.get<Treatment[]>(`/treatments/patient/${patientId}`);
  }

  create(request: CreateTreatmentRequest): Observable<Treatment> {
    return this.api.post<Treatment>('/treatments', request);
  }

  update(id: string, request: UpdateTreatmentRequest): Observable<Treatment> {
    return this.api.put<Treatment>(`/treatments/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/treatments/${id}`);
  }

  // === Follow-ups ===

  getFollowUps(treatmentId: string): Observable<TreatmentFollowUp[]> {
    return this.api.get<TreatmentFollowUp[]>(`/treatments/${treatmentId}/followups`);
  }

  createFollowUp(treatmentId: string, request: CreateFollowUpRequest): Observable<TreatmentFollowUp> {
    return this.api.post<TreatmentFollowUp>(`/treatments/${treatmentId}/followups`, request);
  }

  updateFollowUp(treatmentId: string, id: string, request: UpdateFollowUpRequest): Observable<TreatmentFollowUp> {
    return this.api.put<TreatmentFollowUp>(`/treatments/${treatmentId}/followups/${id}`, request);
  }

  deleteFollowUp(treatmentId: string, id: string): Observable<void> {
    return this.api.delete<void>(`/treatments/${treatmentId}/followups/${id}`);
  }
}
